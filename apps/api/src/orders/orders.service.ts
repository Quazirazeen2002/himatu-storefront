import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ShippingService } from "../shipping/shipping.service";
import type {
  AddressSnapshot,
  OrderDto,
  OrderItemDto,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@himatu/shared";

@Injectable()
export class OrdersService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ShippingService) private readonly shippingService: ShippingService,
  ) {}

  private mapOrderToDto(order: any): OrderDto {
    const items: OrderItemDto[] = (order.items || []).map((item: any) => ({
      id: item.id,
      orderId: item.orderId,
      productId: item.productId,
      productName: item.productName,
      sku: item.sku,
      productImage: item.productImage,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
      createdAt:
        item.createdAt instanceof Date
          ? item.createdAt.toISOString()
          : typeof item.createdAt === "string"
            ? item.createdAt
            : new Date().toISOString(),
    }));

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      addressSnapshot: order.addressSnapshot as AddressSnapshot,
      subtotal: order.subtotal,
      shippingCharge: order.shippingCharge,
      discountAmount: order.discountAmount,
      totalAmount: order.totalAmount,
      currency: order.currency,
      orderStatus: order.orderStatus as OrderStatus,
      paymentStatus: order.paymentStatus as PaymentStatus,
      paymentMethod: order.paymentMethod as PaymentMethod,
      customerNotes: order.customerNotes,
      cancelReason: order.cancelReason,
      cancelledAt: order.cancelledAt
        ? order.cancelledAt instanceof Date
          ? order.cancelledAt.toISOString()
          : String(order.cancelledAt)
        : null,
      createdAt:
        order.createdAt instanceof Date
          ? order.createdAt.toISOString()
          : typeof order.createdAt === "string"
            ? order.createdAt
            : new Date().toISOString(),
      updatedAt:
        order.updatedAt instanceof Date
          ? order.updatedAt.toISOString()
          : typeof order.updatedAt === "string"
            ? order.updatedAt
            : new Date().toISOString(),
      items,
    };
  }

  private generateOrderNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const random = Math.floor(10000 + Math.random() * 90000);
    return `HMT-${year}${month}${day}-${random}`;
  }

  async createOrder(
    userId: string,
    data: {
      addressId: string;
      paymentMethod?: string;
      customerNotes?: string | null;
    },
  ): Promise<OrderDto> {
    // 1. Verify address ownership
    const address = await this.prisma.db.address.findUnique({
      where: { id: data.addressId },
    });

    if (!address) {
      throw new NotFoundException("Delivery address not found");
    }
    if (address.userId !== userId) {
      throw new ForbiddenException("Cannot use an address that does not belong to you");
    }

    // 2. Retrieve customer's cart
    const cart = await this.prisma.db.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                inventory: true,
                images: {
                  orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
                },
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException("Your shopping bag is empty. Add collectibles before checkout.");
    }

    // 3. Process order in transaction
    const order = await this.prisma.db.$transaction(async (tx) => {
      let subtotal = 0;
      const orderItemsData: any[] = [];

      for (const item of cart.items) {
        // Fetch current product & inventory within transaction to prevent race conditions
        const prod = await tx.product.findUnique({
          where: { id: item.productId },
          include: { inventory: true },
        });

        if (!prod || !prod.isActive) {
          throw new ConflictException(
            `Product "${item.product.name}" is no longer active or available`,
          );
        }

        const inv = prod.inventory;
        const available = inv ? inv.quantity - inv.reservedQuantity : 0;

        if (item.quantity > available) {
          throw new ConflictException(
            `Insufficient stock for "${prod.name}". Available: ${available}, Requested: ${item.quantity}`,
          );
        }

        // Deduct stock atomically
        await tx.inventory.update({
          where: { productId: prod.id },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        });

        // Exact server-calculated price
        const unitPrice = prod.salePrice || prod.price;
        const lineTotal = unitPrice * item.quantity;
        subtotal += lineTotal;

        const primaryImg =
          item.product.images.find((img) => img.isPrimary) || item.product.images[0];

        orderItemsData.push({
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          productImage: primaryImg ? primaryImg.imageUrl : null,
          unitPrice,
          quantity: item.quantity,
          lineTotal,
        });
      }

      // 4. Calculate shipping charge
      const shippingCalc = this.shippingService.calculateShipping(
        address.district,
        subtotal,
      );
      const shippingCharge = shippingCalc.shippingCharge;
      const discountAmount = 0;
      const totalAmount = subtotal + shippingCharge - discountAmount;

      const orderNumber = this.generateOrderNumber();

      const addressSnapshot: AddressSnapshot = {
        recipientName: address.recipientName,
        phone: address.phone,
        district: address.district,
        area: address.area,
        fullAddress: address.fullAddress,
        postalCode: address.postalCode,
        label: address.label,
      };

      // 5. Create Order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          addressSnapshot: addressSnapshot as any,
          subtotal,
          shippingCharge,
          discountAmount,
          totalAmount,
          currency: "BDT",
          orderStatus: "PENDING",
          paymentStatus: "PENDING",
          paymentMethod: (data.paymentMethod as any) || "COD",
          customerNotes: data.customerNotes || null,
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: true,
        },
      });

      // 6. Clear customer's cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return newOrder;
    });

    return this.mapOrderToDto(order);
  }

  async listCustomerOrders(userId: string): Promise<OrderDto[]> {
    const orders = await this.prisma.db.order.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });

    return orders.map((o) => this.mapOrderToDto(o));
  }

  async getOrderByNumber(userId: string, orderNumber: string, role?: string): Promise<OrderDto> {
    const order = await this.prisma.db.order.findUnique({
      where: { orderNumber },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderNumber} not found`);
    }

    if (order.userId !== userId && role !== "ADMIN") {
      throw new ForbiddenException("Cannot access another customer's order");
    }

    return this.mapOrderToDto(order);
  }

  async cancelOrder(
    userId: string,
    orderNumber: string,
    reason: string,
  ): Promise<OrderDto> {
    const order = await this.prisma.db.order.findUnique({
      where: { orderNumber },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderNumber} not found`);
    }

    if (order.userId !== userId) {
      throw new ForbiddenException("Cannot cancel another customer's order");
    }

    if (order.orderStatus !== "PENDING" && order.orderStatus !== "CONFIRMED") {
      throw new BadRequestException(
        `Order in '${order.orderStatus}' status cannot be cancelled online. Please contact support.`,
      );
    }

    // Cancel in transaction and release stock
    const updated = await this.prisma.db.$transaction(async (tx) => {
      // Release inventory
      for (const item of order.items) {
        if (item.productId) {
          await tx.inventory.updateMany({
            where: { productId: item.productId },
            data: {
              quantity: {
                increment: item.quantity,
              },
            },
          });
        }
      }

      return tx.order.update({
        where: { id: order.id },
        data: {
          orderStatus: "CANCELLED",
          cancelReason: reason || "Customer requested cancellation",
          cancelledAt: new Date(),
        },
        include: { items: true },
      });
    });

    return this.mapOrderToDto(updated);
  }
}
