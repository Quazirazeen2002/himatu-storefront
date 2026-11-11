import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import type {
  SocialRequestInput,
  ConfirmSocialOrderInput,
} from "@himatu/shared";
import { randomUUID } from "node:crypto";
import nodemailer from "nodemailer";
import { invoiceHtml, type InvoiceSnapshot } from "./invoice";

@Injectable()
export class SocialOrdersService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ConfigService) private readonly config: ConfigService,
  ) {}
  async submit(userId: string, input: SocialRequestInput) {
    // Requests are estimates only. Staff must review prices before enrollment.
    return this.prisma.db.socialOrderRequest.upsert({
      where: {
        userId_clientReference: {
          userId,
          clientReference: input.clientReference,
        },
      },
      update: {},
      create: {
        userId,
        ...input,
        customer: input.customer,
        items: input.items,
      },
    });
  }
  async list(page = 1) {
    const take = 30,
      skip = (Math.max(1, page) - 1) * take;
    const [items, total] = await Promise.all([
      this.prisma.db.socialOrderRequest.findMany({
        orderBy: { createdAt: "desc" },
        take,
        skip,
        include: {
          order: {
            select: {
              orderNumber: true,
              totalAmount: true,
              paymentStatus: true,
            },
          },
        },
      }),
      this.prisma.db.socialOrderRequest.count(),
    ]);
    return {
      items,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / take)),
    };
  }
  async dismiss(id: string) {
    const result = await this.prisma.db.socialOrderRequest.updateMany({
      where: { id, orderId: null, status: "PENDING" },
      data: { status: "CANCELLED" },
    });
    if (!result.count)
      throw new ConflictException("Only pending requests can be dismissed");
    return { ok: true };
  }
  async confirm(id: string, input: ConfirmSocialOrderInput, role: string) {
    if (input.paid && role !== "ADMIN")
      throw new ForbiddenException(
        "Only administrators may record received payment",
      );
    const subtotal = input.items.reduce(
        (n, i) => n + i.quantity * i.unitPrice,
        0,
      ),
      total = subtotal + input.shippingCharge - input.discountAmount;
    if (total < 0 || total > 2000000000)
      throw new BadRequestException("Invalid order total");
    return this.prisma.db.$transaction(async (tx) => {
      const request = await tx.socialOrderRequest.findUnique({ where: { id } });
      if (!request) throw new NotFoundException("Request not found");
      const claim = await tx.socialOrderRequest.updateMany({
        where: { id, orderId: null, status: "PENDING" },
        data: { status: "CONFIRMED" },
      });
      if (!claim.count)
        throw new ConflictException("Request already enrolled or dismissed");
      const lines = [];
      for (const item of input.items) {
        let sku = "SOCIAL",
          image: null | string = null;
        if (item.productId) {
          const p = await tx.product.findUnique({
            where: { id: item.productId },
            include: {
              inventory: true,
              images: { where: { isPrimary: true }, take: 1 },
            },
          });
          if (!p || !p.isActive || !p.inventory)
            throw new BadRequestException(`Product unavailable: ${item.name}`);
          const inv = p.inventory;
          if (inv.quantity - inv.reservedQuantity < item.quantity)
            throw new ConflictException(`Insufficient stock: ${p.name}`);
          const reserved = await tx.inventory.updateMany({
            where: {
              productId: p.id,
              reservedQuantity: inv.reservedQuantity,
              quantity: inv.quantity,
            },
            data: { quantity: { decrement: item.quantity } },
          });
          if (!reserved.count)
            throw new ConflictException(
              "Stock changed. Refresh and try again.",
            );
          sku = p.sku;
          image = p.images[0]?.imageUrl || null;
        }
        lines.push({
          productId: item.productId || null,
          productName: item.name,
          sku,
          productImage: image,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          lineTotal: item.unitPrice * item.quantity,
        });
      }
      const c = input.customer;
      const order = await tx.order.create({
        data: {
          userId: request.userId,
          orderNumber: `HMT-${Date.now()}-${randomUUID().slice(0, 6)}`,
          addressSnapshot: {
            recipientName: c.fullName,
            phone: c.phone,
            fullAddress: c.address,
            area: c.area,
            district: c.district,
            postalCode: c.postalCode,
          },
          subtotal,
          shippingCharge: input.shippingCharge,
          discountAmount: input.discountAmount,
          totalAmount: total,
          paymentMethod: "BKASH",
          paymentStatus: input.paid ? "PAID" : "PENDING",
          orderStatus: "CONFIRMED",
          customerNotes: `Social channel: ${request.channel}\n${c.orderNotes}`,
          items: { create: lines },
        },
        include: { items: true },
      });
      await tx.socialOrderRequest.update({
        where: { id },
        data: { orderId: order.id, customer: c, items: input.items },
      });
      return order;
    });
  }
  async manual(
    staffId: string,
    input: SocialRequestInput,
    confirmation: ConfirmSocialOrderInput,
    role: string,
  ) {
    // Manual entry targets an existing registered customer by email, never a fake account.
    const user = await this.prisma.db.userProfile.findFirst({
      where: { email: input.customer.email },
    });
    if (!user)
      throw new BadRequestException(
        "The customer must create an account with this email first",
      );
    const request = await this.submit(user.id, { ...input, channel: "manual" });
    return this.confirm(request.id, confirmation, role);
  }
  async reviewInvoice(orderId: string, reviewerId: string) {
    const order = await this.prisma.db.order.findUnique({
      where: { id: orderId },
      include: { items: true, user: true },
    });
    if (!order || order.orderStatus === "CANCELLED")
      throw new BadRequestException("A non-cancelled order is required");
    const address = order.addressSnapshot as Record<string, string>;
    const snapshot: InvoiceSnapshot = {
      number: order.orderNumber,
      date: new Date().toISOString().slice(0, 10),
      customer: {
        fullName: address.recipientName || order.user.fullName,
        email: order.user.email,
        phone: address.phone || "",
        address: address.fullAddress || "",
        area: address.area || "",
        district: address.district || "",
      },
      items: order.items.map((i) => ({
        productName: i.productName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        lineTotal: i.lineTotal,
      })),
      subtotal: order.subtotal,
      shippingCharge: order.shippingCharge,
      discountAmount: order.discountAmount,
      totalAmount: order.totalAmount,
      paymentStatus: order.paymentStatus,
    };
    const old = await this.prisma.db.orderInvoice.findUnique({
      where: { orderId },
    });
    if (old?.sendingAt && !old.sentAt)
      throw new ConflictException(
        "Invoice delivery in progress. Check the sender log before unlocking a retry.",
      );
    if (old?.sentAt)
      return {
        ...old,
        html: invoiceHtml(old.snapshot as unknown as InvoiceSnapshot),
      };
    const invoice = await this.prisma.db.orderInvoice.upsert({
      where: { orderId },
      create: {
        orderId,
        reviewedBy: reviewerId,
        snapshot: JSON.parse(JSON.stringify(snapshot)),
      },
      update: {
        snapshot: JSON.parse(JSON.stringify(snapshot)),
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        sentAt: null,
        sendingAt: null,
        messageId: null,
      },
    });
    return { ...invoice, html: invoiceHtml(snapshot) };
  }
  async getInvoice(orderId: string) {
    const invoice = await this.prisma.db.orderInvoice.findUnique({
      where: { orderId },
    });
    if (!invoice) throw new NotFoundException("Review the invoice first");
    return {
      ...invoice,
      html: invoiceHtml(invoice.snapshot as unknown as InvoiceSnapshot),
    };
  }
  async unlockInvoice(orderId: string, checked: boolean) {
    if (!checked)
      throw new BadRequestException(
        "Confirm that the sender log was checked and no email was delivered",
      );
    const result = await this.prisma.db.orderInvoice.updateMany({
      where: { orderId, sentAt: null },
      data: { sendingAt: null },
    });
    if (!result.count)
      throw new ConflictException("A delivered invoice cannot be unlocked");
    return { ok: true };
  }
  async sendInvoice(orderId: string) {
    const host = this.config.get<string>("SMTP_HOST"),
      user = this.config.get<string>("SMTP_USER"),
      pass = this.config.get<string>("SMTP_PASSWORD"),
      from =
        this.config.get<string>("SMTP_FROM") ||
        this.config.get<string>("SMTP_SENDER_EMAIL") ||
        user;
    if (!host || !user || !pass || !from)
      throw new ServiceUnavailableException(
        "Invoice SMTP is not configured on the API server",
      );
    const invoice = await this.prisma.db.orderInvoice.findUnique({
      where: { orderId },
      include: { order: true },
    });
    if (!invoice)
      throw new BadRequestException("Review and approve the invoice first");
    if (invoice.sentAt) return { sentAt: invoice.sentAt, alreadySent: true };
    if (
      invoice.order.orderStatus === "CANCELLED" ||
      invoice.order.updatedAt > invoice.reviewedAt
    )
      throw new ConflictException(
        "Order changed. Review the invoice again before sending.",
      );
    const claim = await this.prisma.db.orderInvoice.updateMany({
      where: { id: invoice.id, sendingAt: null, sentAt: null },
      data: { sendingAt: new Date() },
    });
    if (!claim.count)
      throw new ConflictException(
        "Invoice delivery is already in progress. Verify mail delivery before retrying.",
      );
    const snapshot = invoice.snapshot as unknown as InvoiceSnapshot;
    try {
      const port = Number(this.config.get("SMTP_PORT") || 587);
      const transport = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
        requireTLS: port !== 465,
        connectionTimeout: 15000,
        socketTimeout: 30000,
      });
      const sent = await transport.sendMail({
        from: { name: "HIMATU", address: from },
        to: snapshot.customer.email,
        subject: `HIMATU invoice · ${snapshot.number}`,
        html: invoiceHtml(snapshot),
        text: `HIMATU Invoice ${snapshot.number}\nTotal: BDT ${snapshot.totalAmount}\nContact 01714546809 for order support.`,
      });
      if (!sent.accepted?.length)
        throw new Error("Sender did not accept recipient");
      return await this.prisma.db.orderInvoice.update({
        where: { id: invoice.id },
        data: { sentAt: new Date(), messageId: sent.messageId },
      });
    } catch {
      // Delivery may have been accepted before a connection failure; don't auto resend.
      throw new ServiceUnavailableException(
        "Invoice delivery could not be confirmed. Check the sender's delivery log before retrying; this invoice is locked to prevent duplicate mail.",
      );
    }
  }
}
