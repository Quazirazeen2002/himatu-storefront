import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";
import type {
  CreatePrintingRequestDto,
  CreateQuotationDto,
  PrintingQuotationDto,
  PrintingRequestDto,
} from "@himatu/shared";

@Injectable()
export class PrintingService {
  private readonly logger = new Logger(PrintingService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(StorageService) private readonly storage: StorageService,
  ) {}

  generateRequestNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `PR-${year}-${random}`;
  }

  generateQuotationNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `QUO-${year}-${random}`;
  }

  async createRequest(
    userId: string | null,
    dto: CreatePrintingRequestDto,
  ): Promise<PrintingRequestDto> {
    const requestNumber = this.generateRequestNumber();

    const request = await this.prisma.db.printingRequest.create({
      data: {
        requestNumber,
        userId: userId || null,
        customerName: dto.customerName,
        customerEmail: dto.customerEmail,
        customerPhone: dto.customerPhone,
        title: dto.title,
        animeName: dto.animeName,
        characterName: dto.characterName,
        description: dto.description,
        posePreference: dto.posePreference || null,
        sizePreference: dto.sizePreference || "1/7 Scale (~24cm)",
        materialPreference: dto.materialPreference || "8K Resin",
        finishPreference: dto.finishPreference || "Fully Hand-Painted (Master Level)",
        colorPreference: dto.colorPreference || null,
        budgetEstimate: dto.budgetEstimate ? Math.round(dto.budgetEstimate) : null,
        deadlineDate: dto.deadlineDate ? new Date(dto.deadlineDate) : null,
        customizationDetails: (dto.customizationDetails as any) || undefined,
        status: "SUBMITTED",
      },
      include: {
        images: true,
        quotations: true,
        production: { include: { updates: true } },
      },
    });

    return this.mapToDto(request, false);
  }

  async addReferenceImage(
    requestId: string,
    file: {
      buffer: Buffer;
      originalname: string;
      mimetype: string;
      size: number;
    },
    description?: string,
  ) {
    const request = await this.prisma.db.printingRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException(`Printing request ${requestId} not found`);
    }

    const upload = await this.storage.uploadPrintingReference(requestId, file);

    const image = await this.prisma.db.printingReferenceImage.create({
      data: {
        requestId,
        storagePath: upload.storagePath,
        fileName: upload.fileName,
        fileType: upload.fileType,
        fileSize: upload.fileSize,
        description: description || null,
      },
    });

    return {
      id: image.id,
      requestId: image.requestId,
      storagePath: image.storagePath,
      fileName: image.fileName,
      fileType: image.fileType,
      fileSize: image.fileSize,
      description: image.description,
      downloadUrl: upload.url,
      createdAt: image.createdAt.toISOString(),
    };
  }

  async getMyRequests(userId: string): Promise<PrintingRequestDto[]> {
    const requests = await this.prisma.db.printingRequest.findMany({
      where: { userId },
      include: {
        images: true,
        quotations: { orderBy: { createdAt: "desc" } },
        production: {
          include: {
            updates: { orderBy: { createdAt: "desc" } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return Promise.all(requests.map((r) => this.mapToDto(r, false)));
  }

  async getRequestById(id: string, userId?: string, isAdmin = false): Promise<PrintingRequestDto> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const request = await this.prisma.db.printingRequest.findFirst({
      where: isUuid ? { id } : { requestNumber: id },
      include: {
        images: true,
        quotations: { orderBy: { createdAt: "desc" } },
        production: {
          include: {
            updates: { orderBy: { createdAt: "desc" } },
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException(`Printing request ${id} not found`);
    }

    if (!isAdmin && userId && request.userId && request.userId !== userId) {
      throw new ForbiddenException("Access denied to this printing request");
    }

    return this.mapToDto(request, isAdmin);
  }

  async createQuotation(
    requestId: string,
    adminName: string,
    dto: CreateQuotationDto,
  ): Promise<PrintingQuotationDto> {
    const request = await this.prisma.db.printingRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException(`Printing request ${requestId} not found`);
    }

    const quotationNumber = this.generateQuotationNumber();
    const discount = dto.discountAmount || 0;
    const subtotal =
      dto.baseCost +
      dto.materialCost +
      dto.printingCost +
      dto.finishingCost +
      dto.paintingCost +
      dto.customizationCost +
      dto.shippingCost;

    const totalAmount = Math.max(0, subtotal - discount);
    const depositPercent = dto.depositPercent ?? 50;
    const depositAmount = Math.round((totalAmount * depositPercent) / 100);

    const validityDays = dto.validityDays || 14;
    const validUntil = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000);

    const [quotation] = await this.prisma.db.$transaction([
      this.prisma.db.printingQuotation.create({
        data: {
          requestId,
          quotationNumber,
          baseCost: dto.baseCost,
          materialCost: dto.materialCost,
          printingCost: dto.printingCost,
          finishingCost: dto.finishingCost,
          paintingCost: dto.paintingCost,
          customizationCost: dto.customizationCost,
          shippingCost: dto.shippingCost,
          discountAmount: discount,
          totalAmount,
          currency: "BDT",
          depositPercent,
          depositAmount,
          productionDays: dto.productionDays || 14,
          termsAndNotes: dto.termsAndNotes || "Standard 50% commitment deposit required before 3D sculpting & printing commences.",
          validUntil,
          status: "PENDING",
          createdBy: adminName,
        },
      }),
      this.prisma.db.printingRequest.update({
        where: { id: requestId },
        data: { status: "QUOTED" },
      }),
    ]);

    return {
      id: quotation.id,
      requestId: quotation.requestId,
      quotationNumber: quotation.quotationNumber,
      baseCost: quotation.baseCost,
      materialCost: quotation.materialCost,
      printingCost: quotation.printingCost,
      finishingCost: quotation.finishingCost,
      paintingCost: quotation.paintingCost,
      customizationCost: quotation.customizationCost,
      shippingCost: quotation.shippingCost,
      discountAmount: quotation.discountAmount,
      totalAmount: quotation.totalAmount,
      currency: quotation.currency,
      depositPercent: quotation.depositPercent,
      depositAmount: quotation.depositAmount,
      productionDays: quotation.productionDays,
      termsAndNotes: quotation.termsAndNotes,
      validUntil: quotation.validUntil.toISOString(),
      status: quotation.status as any,
      acceptedAt: null,
      rejectedAt: null,
      rejectionReason: null,
      createdBy: quotation.createdBy,
      createdAt: quotation.createdAt.toISOString(),
      updatedAt: quotation.updatedAt.toISOString(),
    };
  }

  async approveQuotation(
    requestId: string,
    userId: string | null,
    addressId?: string,
  ): Promise<{
    orderId: string;
    orderNumber: string;
    quotationNumber: string;
    depositAmount: number;
    totalAmount: number;
  }> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestId);
    const request = await this.prisma.db.printingRequest.findFirst({
      where: isUuid ? { id: requestId } : { requestNumber: requestId },
      include: {
        quotations: { orderBy: { createdAt: "desc" } },
        user: { include: { addresses: true } },
      },
    });

    if (!request) {
      throw new NotFoundException(`Printing request ${requestId} not found`);
    }

    const activeQuo = request.quotations.find((q) => q.status === "PENDING");
    if (!activeQuo) {
      throw new ConflictException("No pending quotation available to approve for this request");
    }

    if (new Date() > activeQuo.validUntil) {
      await this.prisma.db.printingQuotation.update({
        where: { id: activeQuo.id },
        data: { status: "EXPIRED" },
      });
      throw new ConflictException("This quotation has expired. Please contact support or request a renewed quote.");
    }

    // Resolve delivery address snapshot
    let addressSnapshot: any = null;
    if (userId) {
      const address = addressId
        ? request.user?.addresses.find((a) => a.id === addressId)
        : request.user?.addresses.find((a) => a.isDefault) || request.user?.addresses[0];

      if (address) {
        addressSnapshot = {
          recipientName: address.recipientName,
          phone: address.phone,
          district: address.district,
          area: address.area,
          fullAddress: address.fullAddress,
          postalCode: address.postalCode,
        };
      }
    }

    if (!addressSnapshot) {
      addressSnapshot = {
        recipientName: request.customerName,
        phone: request.customerPhone,
        district: "Dhaka",
        area: "Custom Printing Fulfilment",
        fullAddress: "Customer delivery address provided during quotation review",
        postalCode: "1000",
      };
    }

    // Generate Order
    const now = new Date();
    const orderNumber = `HMT-3D-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;

    const effectiveUserId = request.userId || userId;
    if (!effectiveUserId) {
      throw new BadRequestException("Must be signed in to approve quotation and establish custom manufacturing order.");
    }

    const result = await this.prisma.db.$transaction(async (tx) => {
      // 1. Create Order for deposit amount
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: effectiveUserId,
          addressSnapshot,
          subtotal: activeQuo.depositAmount,
          shippingCharge: 0,
          discountAmount: 0,
          totalAmount: activeQuo.depositAmount,
          currency: "BDT",
          orderStatus: "PROCESSING",
          paymentStatus: "PENDING",
          paymentMethod: "BKASH",
          customerNotes: `Custom 3D Printing: ${request.title} (${request.animeName} - ${request.characterName}). Quotation: ${activeQuo.quotationNumber}. Deposit paid. Remaining balance: ${activeQuo.totalAmount - activeQuo.depositAmount} BDT upon completion.`,
          items: {
            create: {
              productName: `Custom 3D Figure: ${request.title}`,
              sku: `3D-${request.requestNumber}`,
              unitPrice: activeQuo.depositAmount,
              quantity: 1,
              lineTotal: activeQuo.depositAmount,
            },
          },
        },
      });

      // 2. Mark quotation accepted
      await tx.printingQuotation.update({
        where: { id: activeQuo.id },
        data: {
          status: "ACCEPTED",
          acceptedAt: new Date(),
          orderId: order.id,
        },
      });

      // 3. Update request status
      await tx.printingRequest.update({
        where: { id: request.id },
        data: { status: "IN_PRODUCTION" },
      });

      // 4. Initialize production pipeline
      const production = await tx.printingProduction.create({
        data: {
          requestId: request.id,
          orderId: order.id,
          stage: "3D_MODELING",
          targetCompletionDate: new Date(Date.now() + activeQuo.productionDays * 24 * 60 * 60 * 1000),
          updates: {
            create: {
              stage: "3D_MODELING",
              customerMessage: "Quotation approved and order initiated! Our 3D digital sculptors are now preparing the master character geometry.",
              internalNote: "Quotation accepted by customer. Production pipeline opened.",
              createdBy: "System Automation",
            },
          },
        },
      });

      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        quotationNumber: activeQuo.quotationNumber,
        depositAmount: activeQuo.depositAmount,
        totalAmount: activeQuo.totalAmount,
      };
    });

    return result;
  }

  async rejectQuotation(
    requestId: string,
    reason?: string,
  ): Promise<{ status: string; quotationNumber: string }> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestId);
    const request = await this.prisma.db.printingRequest.findFirst({
      where: isUuid ? { id: requestId } : { requestNumber: requestId },
      include: {
        quotations: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!request) {
      throw new NotFoundException(`Printing request ${requestId} not found`);
    }

    const activeQuo = request.quotations.find((q) => q.status === "PENDING");
    if (!activeQuo) {
      throw new ConflictException("No pending quotation to reject");
    }

    await this.prisma.db.$transaction([
      this.prisma.db.printingQuotation.update({
        where: { id: activeQuo.id },
        data: {
          status: "REJECTED",
          rejectedAt: new Date(),
          rejectionReason: reason || "Declined by customer",
        },
      }),
      this.prisma.db.printingRequest.update({
        where: { id: request.id },
        data: { status: "QUOTATION_REJECTED" },
      }),
    ]);

    return {
      status: "REJECTED",
      quotationNumber: activeQuo.quotationNumber,
    };
  }

  async listAllAdmin(params: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.status) where.status = params.status;
    if (params.search) {
      where.OR = [
        { requestNumber: { contains: params.search, mode: "insensitive" } },
        { customerName: { contains: params.search, mode: "insensitive" } },
        { customerEmail: { contains: params.search, mode: "insensitive" } },
        { title: { contains: params.search, mode: "insensitive" } },
        { characterName: { contains: params.search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.db.printingRequest.findMany({
        where,
        include: {
          images: true,
          quotations: { orderBy: { createdAt: "desc" } },
          production: { include: { updates: { orderBy: { createdAt: "desc" } } } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.db.printingRequest.count({ where }),
    ]);

    const mapped = await Promise.all(items.map((i) => this.mapToDto(i, true)));

    return {
      items: mapped,
      total,
      page,
      limit,
    };
  }

  async updateRequestStatus(requestId: string, status: string, internalNotes?: string) {
    const updateData: any = { status };
    if (internalNotes !== undefined) {
      updateData.internalNotes = internalNotes;
    }

    const request = await this.prisma.db.printingRequest.update({
      where: { id: requestId },
      data: updateData,
      include: {
        images: true,
        quotations: true,
        production: { include: { updates: true } },
      },
    });

    return this.mapToDto(request, true);
  }

  async mapToDto(r: any, isAdmin = false): Promise<PrintingRequestDto> {
    const activeQuo = r.quotations?.find((q: any) => q.status === "PENDING" || q.status === "ACCEPTED");

    const imagesWithUrls = await Promise.all(
      (r.images || []).map(async (img: any) => ({
        id: img.id,
        requestId: img.requestId,
        storagePath: img.storagePath,
        fileName: img.fileName,
        fileType: img.fileType,
        fileSize: img.fileSize,
        description: img.description,
        downloadUrl: await this.storage.getSignedPrintingUrl(img.storagePath),
        createdAt: img.createdAt.toISOString(),
      })),
    );

    return {
      id: r.id,
      requestNumber: r.requestNumber,
      userId: r.userId,
      customerName: r.customerName,
      customerEmail: r.customerEmail,
      customerPhone: r.customerPhone,
      title: r.title,
      animeName: r.animeName,
      characterName: r.characterName,
      description: r.description,
      posePreference: r.posePreference,
      sizePreference: r.sizePreference,
      materialPreference: r.materialPreference,
      finishPreference: r.finishPreference,
      colorPreference: r.colorPreference,
      budgetEstimate: r.budgetEstimate,
      deadlineDate: r.deadlineDate ? r.deadlineDate.toISOString() : null,
      customizationDetails: r.customizationDetails,
      status: r.status,
      internalNotes: isAdmin ? r.internalNotes : null, // Privacy filter
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      images: imagesWithUrls,
      quotations: (r.quotations || []).map((q: any) => ({
        id: q.id,
        requestId: q.requestId,
        quotationNumber: q.quotationNumber,
        baseCost: q.baseCost,
        materialCost: q.materialCost,
        printingCost: q.printingCost,
        finishingCost: q.finishingCost,
        paintingCost: q.paintingCost,
        customizationCost: q.customizationCost,
        shippingCost: q.shippingCost,
        discountAmount: q.discountAmount,
        totalAmount: q.totalAmount,
        currency: q.currency,
        depositPercent: q.depositPercent,
        depositAmount: q.depositAmount,
        productionDays: q.productionDays,
        termsAndNotes: q.termsAndNotes,
        validUntil: q.validUntil.toISOString(),
        status: q.status,
        acceptedAt: q.acceptedAt ? q.acceptedAt.toISOString() : null,
        rejectedAt: q.rejectedAt ? q.rejectedAt.toISOString() : null,
        rejectionReason: q.rejectionReason,
        createdBy: q.createdBy,
        createdAt: q.createdAt.toISOString(),
        updatedAt: q.updatedAt.toISOString(),
        orderId: q.orderId,
      })),
      activeQuotation: activeQuo
        ? {
            id: activeQuo.id,
            requestId: activeQuo.requestId,
            quotationNumber: activeQuo.quotationNumber,
            baseCost: activeQuo.baseCost,
            materialCost: activeQuo.materialCost,
            printingCost: activeQuo.printingCost,
            finishingCost: activeQuo.finishingCost,
            paintingCost: activeQuo.paintingCost,
            customizationCost: activeQuo.customizationCost,
            shippingCost: activeQuo.shippingCost,
            discountAmount: activeQuo.discountAmount,
            totalAmount: activeQuo.totalAmount,
            currency: activeQuo.currency,
            depositPercent: activeQuo.depositPercent,
            depositAmount: activeQuo.depositAmount,
            productionDays: activeQuo.productionDays,
            termsAndNotes: activeQuo.termsAndNotes,
            validUntil: activeQuo.validUntil.toISOString(),
            status: activeQuo.status,
            acceptedAt: activeQuo.acceptedAt ? activeQuo.acceptedAt.toISOString() : null,
            rejectedAt: activeQuo.rejectedAt ? activeQuo.rejectedAt.toISOString() : null,
            rejectionReason: activeQuo.rejectionReason,
            createdBy: activeQuo.createdBy,
            createdAt: activeQuo.createdAt.toISOString(),
            updatedAt: activeQuo.updatedAt.toISOString(),
            orderId: activeQuo.orderId,
          }
        : null,
      production: r.production
        ? {
            id: r.production.id,
            requestId: r.production.requestId,
            orderId: r.production.orderId,
            stage: r.production.stage,
            targetCompletionDate: r.production.targetCompletionDate
              ? r.production.targetCompletionDate.toISOString()
              : null,
            actualCompletionDate: r.production.actualCompletionDate
              ? r.production.actualCompletionDate.toISOString()
              : null,
            assignedTechnician: r.production.assignedTechnician,
            notes: isAdmin ? r.production.notes : null,
            createdAt: r.production.createdAt.toISOString(),
            updatedAt: r.production.updatedAt.toISOString(),
            updates: (r.production.updates || []).map((u: any) => ({
              id: u.id,
              productionId: u.productionId,
              stage: u.stage,
              customerMessage: u.customerMessage,
              internalNote: isAdmin ? u.internalNote : null,
              progressImageUrl: u.progressImageUrl,
              createdBy: u.createdBy,
              createdAt: u.createdAt.toISOString(),
            })),
          }
        : null,
    };
  }
}
