import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type {
  CreateProductionUpdateDto,
  PrintingProductionDto,
  ProductionStage,
} from "@himatu/shared";

export const PRODUCTION_STAGES: ProductionStage[] = [
  "3D_MODELING",
  "MODEL_SLICING",
  "PRINTING_STARTED",
  "PRINT_CLEANUP_CURING",
  "SURFACE_PRIMING",
  "AIRBRUSH_BASE",
  "DETAIL_HAND_PAINTING",
  "CLEAR_COAT_FINISH",
  "QUALITY_INSPECTION",
  "PACKED_FOR_DELIVERY",
];

@Injectable()
export class ProductionService {
  private readonly logger = new Logger(ProductionService.name);

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getProductionBoard() {
    const productions = await this.prisma.db.printingProduction.findMany({
      include: {
        request: true,
        order: true,
        updates: { orderBy: { createdAt: "desc" } },
      },
      orderBy: { updatedAt: "desc" },
    });

    const columns: Record<string, any[]> = {};
    for (const stage of PRODUCTION_STAGES) {
      columns[stage] = [];
    }

    for (const item of productions) {
      const stage = item.stage || "3D_MODELING";
      if (!columns[stage]) columns[stage] = [];
      columns[stage].push({
        id: item.id,
        requestId: item.requestId,
        requestNumber: item.request.requestNumber,
        title: item.request.title,
        animeName: item.request.animeName,
        characterName: item.request.characterName,
        customerName: item.request.customerName,
        orderId: item.orderId,
        orderNumber: item.order?.orderNumber,
        stage: item.stage,
        targetCompletionDate: item.targetCompletionDate?.toISOString() || null,
        actualCompletionDate: item.actualCompletionDate?.toISOString() || null,
        assignedTechnician: item.assignedTechnician,
        notes: item.notes,
        updatesCount: item.updates.length,
        lastUpdate: item.updates[0]
          ? {
              customerMessage: item.updates[0].customerMessage,
              createdAt: item.updates[0].createdAt.toISOString(),
            }
          : null,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      });
    }

    return {
      stages: PRODUCTION_STAGES,
      totalActive: productions.filter((p) => p.stage !== "PACKED_FOR_DELIVERY").length,
      columns,
    };
  }

  async updateStage(
    productionId: string,
    data: { stage: ProductionStage; notes?: string; assignedTechnician?: string },
  ): Promise<PrintingProductionDto> {
    if (!PRODUCTION_STAGES.includes(data.stage)) {
      throw new BadRequestException(
        `Invalid production stage: "${data.stage}". Valid stages are: ${PRODUCTION_STAGES.join(", ")}`,
      );
    }

    const production = await this.prisma.db.printingProduction.findUnique({
      where: { id: productionId },
      include: { request: true, order: true },
    });

    if (!production) {
      throw new NotFoundException(`Production record ${productionId} not found`);
    }

    const isDelivered = data.stage === "PACKED_FOR_DELIVERY";

    const [updated] = await this.prisma.db.$transaction([
      this.prisma.db.printingProduction.update({
        where: { id: productionId },
        data: {
          stage: data.stage,
          notes: data.notes !== undefined ? data.notes : production.notes,
          assignedTechnician:
            data.assignedTechnician !== undefined
              ? data.assignedTechnician
              : production.assignedTechnician,
          actualCompletionDate: isDelivered ? new Date() : production.actualCompletionDate,
        },
        include: {
          updates: { orderBy: { createdAt: "desc" } },
        },
      }),
      this.prisma.db.productionUpdate.create({
        data: {
          productionId,
          stage: data.stage,
          customerMessage: `Production milestone reached: Figure has advanced to ${data.stage.replace(/_/g, " ")}.`,
          internalNote: data.notes || `Stage transitioned from ${production.stage} to ${data.stage}.`,
          createdBy: "Production Manager",
        },
      }),
      ...(isDelivered
        ? [
            this.prisma.db.printingRequest.update({
              where: { id: production.requestId },
              data: { status: "COMPLETED" },
            }),
            ...(production.orderId
              ? [
                  this.prisma.db.order.update({
                    where: { id: production.orderId },
                    data: { orderStatus: "DELIVERED" },
                  }),
                ]
              : []),
          ]
        : []),
    ]);

    return {
      id: updated.id,
      requestId: updated.requestId,
      orderId: updated.orderId,
      stage: updated.stage,
      targetCompletionDate: updated.targetCompletionDate?.toISOString() || null,
      actualCompletionDate: updated.actualCompletionDate?.toISOString() || null,
      assignedTechnician: updated.assignedTechnician,
      notes: updated.notes,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      updates: updated.updates.map((u) => ({
        id: u.id,
        productionId: u.productionId,
        stage: u.stage,
        customerMessage: u.customerMessage,
        internalNote: u.internalNote,
        progressImageUrl: u.progressImageUrl,
        createdBy: u.createdBy,
        createdAt: u.createdAt.toISOString(),
      })),
    };
  }

  async addProgressUpdate(
    productionId: string,
    dto: CreateProductionUpdateDto,
    author: string,
  ) {
    const production = await this.prisma.db.printingProduction.findUnique({
      where: { id: productionId },
    });

    if (!production) {
      throw new NotFoundException(`Production record ${productionId} not found`);
    }

    const update = await this.prisma.db.productionUpdate.create({
      data: {
        productionId,
        stage: dto.stage || production.stage,
        customerMessage: dto.customerMessage,
        internalNote: dto.internalNote || null,
        progressImageUrl: dto.progressImageUrl || null,
        createdBy: author,
      },
    });

    return {
      id: update.id,
      productionId: update.productionId,
      stage: update.stage,
      customerMessage: update.customerMessage,
      internalNote: update.internalNote,
      progressImageUrl: update.progressImageUrl,
      createdBy: update.createdBy,
      createdAt: update.createdAt.toISOString(),
    };
  }
}

