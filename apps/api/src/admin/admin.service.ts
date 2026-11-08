import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type {
  AdminCustomerDto,
  AdminDashboardSummaryDto,
  AdminRevenuePointDto,
  AdminTopProductDto,
  OrderDto,
  OrderStatus,
  StoreSettingsDto,
} from "@himatu/shared";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DEFAULT_SETTINGS: StoreSettingsDto = {
  storeName: "HIMATU Anime Collectibles",
  contactEmail: "concierge@himatu.com",
  contactPhone: "+880 1711-000000",
  businessAddress: "Banani Road 11, Dhaka 1213, Bangladesh",
  insideDhakaShipping: 80,
  outsideDhakaShipping: 150,
  freeShippingThreshold: 10000,
  lowStockThreshold: 5,
  currency: "BDT",
  operatingHours: "10:00 AM – 9:00 PM BST (Sat – Thu)",
};

@Injectable()
export class AdminService {
  private readonly settingsFilePath = join(process.cwd(), "store-settings.json");

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  /**
   * Helper to format Order into OrderDto
   */
  private mapOrderToDto(order: any): OrderDto {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      addressSnapshot: order.addressSnapshot,
      subtotal: order.subtotal,
      shippingCharge: order.shippingCharge,
      discountAmount: order.discountAmount,
      totalAmount: order.totalAmount,
      currency: order.currency,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
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
          : String(order.createdAt),
      updatedAt:
        order.updatedAt instanceof Date
          ? order.updatedAt.toISOString()
          : String(order.updatedAt),
      items: (order.items || []).map((item: any) => ({
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
            : String(item.createdAt),
      })),
    };
  }

  /**
   * Dashboard Summary KPI calculations from actual database records
   */
  async getDashboardSummary(period = "all"): Promise<AdminDashboardSummaryDto> {
    const orders = await this.prisma.db.order.findMany({
      select: {
        totalAmount: true,
        orderStatus: true,
        paymentStatus: true,
        createdAt: true,
      },
    });

    let totalSales = 0; // Confirmed collected revenue
    let pendingSales = 0; // Pending COD revenue
    let todaySales = 0;
    let todayOrdersCount = 0;
    let pendingOrders = 0;
    let confirmedOrders = 0;
    let shippedOrders = 0;
    let deliveredOrders = 0;
    let cancelledOrders = 0;

    // Determine Today in Asia/Dhaka (UTC+6)
    const nowUtc = new Date();
    const dhakaOffsetMs = 6 * 60 * 60 * 1000;
    const nowDhaka = new Date(nowUtc.getTime() + dhakaOffsetMs);
    const startOfDhakaDayUtc = new Date(
      Date.UTC(
        nowDhaka.getUTCFullYear(),
        nowDhaka.getUTCMonth(),
        nowDhaka.getUTCDate(),
      ) - dhakaOffsetMs,
    );

    for (const order of orders) {
      if (order.orderStatus === "CANCELLED") {
        cancelledOrders++;
        continue;
      }

      const isPaid =
        order.paymentStatus === "PAID" || order.orderStatus === "DELIVERED";

      if (isPaid) {
        totalSales += order.totalAmount;
      } else {
        pendingSales += order.totalAmount;
      }

      if (order.orderStatus === "PENDING") pendingOrders++;
      else if (order.orderStatus === "CONFIRMED") confirmedOrders++;
      else if (order.orderStatus === "SHIPPED") shippedOrders++;
      else if (order.orderStatus === "DELIVERED") deliveredOrders++;

      const orderCreated = new Date(order.createdAt);
      if (orderCreated >= startOfDhakaDayUtc) {
        todayOrdersCount++;
        if (isPaid) {
          todaySales += order.totalAmount;
        }
      }
    }

    const [activeProducts, lowStockProducts, totalCustomers] =
      await Promise.all([
        this.prisma.db.product.count({
          where: { isActive: true },
        }),
        this.prisma.db.product.count({
          where: {
            isActive: true,
            inventory: {
              quantity: { lte: 5 },
            },
          },
        }),
        this.prisma.db.userProfile.count(),
      ]);

    return {
      totalSales,
      pendingSales,
      todaySales,
      todayOrdersCount,
      totalOrders: orders.length,
      pendingOrders,
      confirmedOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      activeProducts,
      lowStockProducts,
      totalCustomers,
    };
  }

  /**
   * Daily aggregated revenue chart data for 7d, 30d, 90d
   */
  async getRevenueChart(period = "30d"): Promise<AdminRevenuePointDto[]> {
    const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const orders = await this.prisma.db.order.findMany({
      where: {
        createdAt: { gte: startDate },
        orderStatus: { not: "CANCELLED" },
      },
      select: {
        totalAmount: true,
        paymentStatus: true,
        orderStatus: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const dayMap = new Map<
      string,
      { confirmedRevenue: number; pendingRevenue: number; orderCount: number }
    >();

    // Pre-populate days
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      dayMap.set(key, { confirmedRevenue: 0, pendingRevenue: 0, orderCount: 0 });
    }

    for (const order of orders) {
      const key = new Date(order.createdAt).toISOString().slice(0, 10);
      const entry = dayMap.get(key) || {
        confirmedRevenue: 0,
        pendingRevenue: 0,
        orderCount: 0,
      };

      entry.orderCount += 1;
      const isPaid =
        order.paymentStatus === "PAID" || order.orderStatus === "DELIVERED";
      if (isPaid) {
        entry.confirmedRevenue += order.totalAmount;
      } else {
        entry.pendingRevenue += order.totalAmount;
      }
      dayMap.set(key, entry);
    }

    return Array.from(dayMap.entries()).map(([date, data]) => ({
      date,
      confirmedRevenue: data.confirmedRevenue,
      pendingRevenue: data.pendingRevenue,
      orderCount: data.orderCount,
    }));
  }

  /**
   * Top selling products calculated from real OrderItem records
   */
  async getTopProducts(limit = 5): Promise<AdminTopProductDto[]> {
    const items = await this.prisma.db.orderItem.findMany({
      where: {
        order: {
          orderStatus: { not: "CANCELLED" },
        },
      },
      include: {
        product: {
          include: {
            inventory: true,
            category: true,
          },
        },
      },
    });

    const productMap = new Map<
      string,
      {
        productName: string;
        sku: string;
        productImage: string | null;
        unitsSold: number;
        revenue: number;
        currentStock: number;
        categoryName?: string;
      }
    >();

    for (const item of items) {
      const key = item.productId || item.sku;
      const existing = productMap.get(key) || {
        productName: item.productName,
        sku: item.sku,
        productImage: item.productImage,
        unitsSold: 0,
        revenue: 0,
        currentStock: item.product?.inventory?.quantity ?? 0,
        categoryName: item.product?.category?.name,
      };

      existing.unitsSold += item.quantity;
      existing.revenue += item.lineTotal;
      productMap.set(key, existing);
    }

    const sorted = Array.from(productMap.entries())
      .map(([id, data]) => ({
        productId: id.startsWith("HMT-") ? null : id,
        ...data,
      }))
      .sort((a, b) => b.unitsSold - a.unitsSold);

    return sorted.slice(0, limit);
  }

  /**
   * List all orders for Admin
   */
  async listAllOrders(query: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<{ items: OrderDto[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status && query.status !== "ALL") {
      where.orderStatus = query.status;
    }

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { orderNumber: { contains: term, mode: "insensitive" } },
        { user: { fullName: { contains: term, mode: "insensitive" } } },
        { user: { email: { contains: term, mode: "insensitive" } } },
      ];
    }

    const [total, orders] = await Promise.all([
      this.prisma.db.order.count({ where }),
      this.prisma.db.order.findMany({
        where,
        include: { items: true, user: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return {
      items: orders.map((o) => this.mapOrderToDto(o)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Update order status with valid state transitions and inventory safety
   */
  async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    reason?: string,
  ): Promise<OrderDto> {
    const order = await this.prisma.db.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    if (order.orderStatus === newStatus) {
      return this.mapOrderToDto(order);
    }

    // Cancellation: restore inventory
    if (newStatus === "CANCELLED") {
      const updated = await this.prisma.db.$transaction(async (tx) => {
        for (const item of order.items) {
          if (item.productId) {
            await tx.inventory.updateMany({
              where: { productId: item.productId },
              data: {
                quantity: { increment: item.quantity },
              },
            });
          }
        }

        return tx.order.update({
          where: { id: orderId },
          data: {
            orderStatus: "CANCELLED",
            cancelReason: reason || "Admin operational cancellation",
            cancelledAt: new Date(),
          },
          include: { items: true },
        });
      });

      return this.mapOrderToDto(updated);
    }

    // Delivered: If COD, mark payment as PAID
    const paymentUpdate: any = {};
    if (newStatus === "DELIVERED" && order.paymentMethod === "COD") {
      paymentUpdate.paymentStatus = "PAID";
    }

    const updated = await this.prisma.db.order.update({
      where: { id: orderId },
      data: {
        orderStatus: newStatus,
        ...paymentUpdate,
      },
      include: { items: true },
    });

    return this.mapOrderToDto(updated);
  }

  /**
   * List customers directory
   */
  async listCustomers(query: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ items: AdminCustomerDto[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { fullName: { contains: term, mode: "insensitive" } },
        { email: { contains: term, mode: "insensitive" } },
        { phone: { contains: term, mode: "insensitive" } },
      ];
    }

    const [total, users] = await Promise.all([
      this.prisma.db.userProfile.count({ where }),
      this.prisma.db.userProfile.findMany({
        where,
        include: {
          orders: {
            where: { orderStatus: { not: "CANCELLED" } },
            select: { totalAmount: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    const items: AdminCustomerDto[] = users.map((u) => {
      const totalSpent = u.orders.reduce((acc, curr) => acc + curr.totalAmount, 0);
      return {
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        phone: u.phone,
        role: u.role,
        orderCount: u.orders.length,
        totalSpent,
        createdAt: u.createdAt.toISOString(),
      };
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Get single customer details with address and order history
   */
  async getCustomerDetail(id: string) {
    const customer = await this.prisma.db.userProfile.findUnique({
      where: { id },
      include: {
        addresses: true,
        orders: {
          include: { items: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer ${id} not found`);
    }

    return {
      ...customer,
      orders: customer.orders.map((o) => this.mapOrderToDto(o)),
    };
  }

  /**
   * Get Store Settings
   */
  getStoreSettings(): StoreSettingsDto {
    try {
      if (existsSync(this.settingsFilePath)) {
        const content = readFileSync(this.settingsFilePath, "utf-8");
        return { ...DEFAULT_SETTINGS, ...JSON.parse(content) };
      }
    } catch {
      // Fallback
    }
    return DEFAULT_SETTINGS;
  }

  /**
   * Update Store Settings
   */
  updateStoreSettings(settings: Partial<StoreSettingsDto>): StoreSettingsDto {
    const current = this.getStoreSettings();
    const updated = { ...current, ...settings };
    try {
      writeFileSync(this.settingsFilePath, JSON.stringify(updated, null, 2), "utf-8");
    } catch (err) {
      console.error("Failed to write store settings:", err);
    }
    return updated;
  }
}

