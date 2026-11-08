import { Inject, Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type {
  AnalyticsFilterParams,
  AnalyticsOverviewDto,
  CollectionPerformanceDto,
  ConversionFunnelDto,
  CustomerInsightsDto,
  InventoryHealthDto,
  OrderFulfilmentDto,
  ProductLeaderboardDto,
  RevenueIntelligenceDto,
  CreateAnalyticsEventDto,
} from "@himatu/shared";

const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000; // UTC+6

@Injectable()
export class AnalyticsService {
  // First recorded timestamp for event tracking system
  private readonly trackingActivationDate = new Date("2026-11-08T00:00:00.000Z");

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  /**
   * Resolve current and previous date range in Asia/Dhaka (UTC+6)
   */
  resolveDateRanges(params: AnalyticsFilterParams) {
    const nowUtc = new Date();
    const nowDhaka = new Date(nowUtc.getTime() + DHAKA_OFFSET_MS);

    let start: Date;
    let end: Date = nowUtc;

    const period = params.period || "last_30_days";

    switch (period) {
      case "today": {
        const startOfDhakaDay = new Date(
          Date.UTC(
            nowDhaka.getUTCFullYear(),
            nowDhaka.getUTCMonth(),
            nowDhaka.getUTCDate(),
          ) - DHAKA_OFFSET_MS,
        );
        start = startOfDhakaDay;
        break;
      }
      case "last_7_days": {
        start = new Date(nowUtc.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      }
      case "last_30_days": {
        start = new Date(nowUtc.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      }
      case "last_90_days": {
        start = new Date(nowUtc.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      }
      case "this_month": {
        const startOfMonthUtc = new Date(
          Date.UTC(nowDhaka.getUTCFullYear(), nowDhaka.getUTCMonth(), 1) -
            DHAKA_OFFSET_MS,
        );
        start = startOfMonthUtc;
        break;
      }
      case "prev_month": {
        const startOfPrevMonthUtc = new Date(
          Date.UTC(nowDhaka.getUTCFullYear(), nowDhaka.getUTCMonth() - 1, 1) -
            DHAKA_OFFSET_MS,
        );
        const endOfPrevMonthUtc = new Date(
          Date.UTC(nowDhaka.getUTCFullYear(), nowDhaka.getUTCMonth(), 0, 23, 59, 59, 999) -
            DHAKA_OFFSET_MS,
        );
        start = startOfPrevMonthUtc;
        end = endOfPrevMonthUtc;
        break;
      }
      case "this_year": {
        const startOfYearUtc = new Date(
          Date.UTC(nowDhaka.getUTCFullYear(), 0, 1) - DHAKA_OFFSET_MS,
        );
        start = startOfYearUtc;
        break;
      }
      case "custom": {
        if (!params.startDate || !params.endDate) {
          throw new BadRequestException("Custom period requires startDate and endDate");
        }
        start = new Date(params.startDate);
        end = new Date(params.endDate);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
          throw new BadRequestException("Invalid startDate or endDate provided");
        }
        break;
      }
      default: {
        start = new Date(nowUtc.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
    }

    const durationMs = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - durationMs);
    const prevEnd = new Date(start.getTime());

    return {
      current: { start, end },
      previous: { start: prevStart, end: prevEnd },
      period,
    };
  }

  /**
   * Calculate percentage growth safely (returns null if previous baseline is zero)
   */
  private calculateGrowth(current: number, previous: number): number | null {
    if (previous <= 0) return null; // Avoid misleading infinite or zero-division percentages
    const diff = current - previous;
    return Math.round((diff / previous) * 1000) / 10;
  }

  /**
   * 1. REVENUE INTELLIGENCE
   */
  async getRevenueIntelligence(params: AnalyticsFilterParams): Promise<RevenueIntelligenceDto> {
    const { current, previous, period } = this.resolveDateRanges(params);

    // Current period orders
    const currentOrders = await this.prisma.db.order.findMany({
      where: {
        createdAt: { gte: current.start, lte: current.end },
        ...(params.orderStatus ? { orderStatus: params.orderStatus as any } : {}),
        ...(params.paymentMethod ? { paymentMethod: params.paymentMethod as any } : {}),
      },
      include: { items: true },
    });

    // Previous period orders
    const previousOrders = await this.prisma.db.order.findMany({
      where: {
        createdAt: { gte: previous.start, lte: previous.end },
        ...(params.orderStatus ? { orderStatus: params.orderStatus as any } : {}),
        ...(params.paymentMethod ? { paymentMethod: params.paymentMethod as any } : {}),
      },
    });

    let grossOrderValue = 0;
    let collectedRevenue = 0;
    let pendingCodRevenue = 0;
    let validOrdersCount = 0;
    let cancelledOrders = 0;

    const paymentMethodMap: Record<string, { count: number; amount: number }> = {};

    for (const order of currentOrders) {
      const pm = order.paymentMethod || "COD";
      if (!paymentMethodMap[pm]) {
        paymentMethodMap[pm] = { count: 0, amount: 0 };
      }

      if (order.orderStatus === "CANCELLED") {
        cancelledOrders++;
        continue;
      }

      validOrdersCount++;
      grossOrderValue += order.totalAmount;
      paymentMethodMap[pm].count += 1;
      paymentMethodMap[pm].amount += order.totalAmount;

      const isPaid = order.paymentStatus === "PAID" || order.orderStatus === "DELIVERED";
      if (isPaid) {
        collectedRevenue += order.totalAmount;
      } else if (order.paymentMethod === "COD") {
        pendingCodRevenue += order.totalAmount;
      }
    }

    const averageOrderValue = validOrdersCount > 0 ? Math.round(grossOrderValue / validOrdersCount) : 0;

    // Previous metrics
    let prevGov = 0;
    let prevCollected = 0;
    let prevValidOrders = 0;
    for (const order of previousOrders) {
      if (order.orderStatus === "CANCELLED") continue;
      prevValidOrders++;
      prevGov += order.totalAmount;
      if (order.paymentStatus === "PAID" || order.orderStatus === "DELIVERED") {
        prevCollected += order.totalAmount;
      }
    }
    const prevAov = prevValidOrders > 0 ? Math.round(prevGov / prevValidOrders) : 0;

    // Daily trend points
    const trendMap: Record<string, { collected: number; gross: number; orders: number }> = {};
    const daysCount = Math.max(1, Math.min(90, Math.ceil((current.end.getTime() - current.start.getTime()) / (24 * 3600 * 1000))));

    // Seed dates
    for (let i = 0; i < daysCount; i++) {
      const d = new Date(current.start.getTime() + i * 24 * 3600 * 1000);
      const dateStr = d.toISOString().split("T")[0];
      trendMap[dateStr] = { collected: 0, gross: 0, orders: 0 };
    }

    for (const order of currentOrders) {
      if (order.orderStatus === "CANCELLED") continue;
      const dateStr = order.createdAt.toISOString().split("T")[0];
      if (!trendMap[dateStr]) {
        trendMap[dateStr] = { collected: 0, gross: 0, orders: 0 };
      }
      trendMap[dateStr].gross += order.totalAmount;
      trendMap[dateStr].orders += 1;
      if (order.paymentStatus === "PAID" || order.orderStatus === "DELIVERED") {
        trendMap[dateStr].collected += order.totalAmount;
      }
    }

    const trendPoints = Object.entries(trendMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, val]) => ({
        date,
        collected: val.collected,
        gross: val.gross,
        orders: val.orders,
      }));

    // Payment distribution
    const paymentMethods = Object.entries(paymentMethodMap).map(([method, data]) => {
      const share = grossOrderValue > 0 ? Math.round((data.amount / grossOrderValue) * 1000) / 10 : 0;
      let name = "Cash on Delivery";
      if (method === "BKASH") name = "bKash Mobile Wallet";
      else if (method === "NAGAD") name = "Nagad Wallet";
      else if (method === "CARD") name = "Credit / Debit Card";
      return {
        method,
        name,
        amount: data.amount,
        count: data.count,
        sharePercentage: share,
      };
    });

    return {
      grossOrderValue,
      collectedRevenue,
      pendingCodRevenue,
      averageOrderValue,
      totalOrders: validOrdersCount,
      cancelledOrders,
      comparison: {
        govChangePercent: this.calculateGrowth(grossOrderValue, prevGov),
        govChangeAbsolute: grossOrderValue - prevGov,
        collectedChangePercent: this.calculateGrowth(collectedRevenue, prevCollected),
        collectedChangeAbsolute: collectedRevenue - prevCollected,
        aovChangePercent: this.calculateGrowth(averageOrderValue, prevAov),
        ordersChangePercent: this.calculateGrowth(validOrdersCount, prevValidOrders),
        previousPeriodLabel: `vs previous ${period.replace("_", " ")}`,
      },
      trendPoints,
      paymentMethods,
    };
  }

  /**
   * 2. ANIME COLLECTION PERFORMANCE
   */
  async getCollectionPerformance(params: AnalyticsFilterParams): Promise<CollectionPerformanceDto> {
    const { current, previous } = this.resolveDateRanges(params);

    const categories = await this.prisma.db.category.findMany({
      where: { isActive: true },
      include: {
        products: {
          select: { id: true },
        },
      },
      orderBy: { displayOrder: "asc" },
    });

    // Orders in current period
    const currentOrders = await this.prisma.db.order.findMany({
      where: {
        createdAt: { gte: current.start, lte: current.end },
        orderStatus: { not: "CANCELLED" },
      },
      include: {
        items: {
          include: {
            product: {
              select: { categoryId: true },
            },
          },
        },
      },
    });

    // Orders in previous period
    const previousOrders = await this.prisma.db.order.findMany({
      where: {
        createdAt: { gte: previous.start, lte: previous.end },
        orderStatus: { not: "CANCELLED" },
      },
      include: {
        items: {
          include: {
            product: {
              select: { categoryId: true },
            },
          },
        },
      },
    });

    const categoryStats: Record<
      string,
      { unitsSold: number; revenue: number; orderIds: Set<string>; prevRevenue: number }
    > = {};

    for (const cat of categories) {
      categoryStats[cat.id] = {
        unitsSold: 0,
        revenue: 0,
        orderIds: new Set<string>(),
        prevRevenue: 0,
      };
    }

    let totalCollectionRevenue = 0;

    for (const order of currentOrders) {
      for (const item of order.items) {
        const catId = item.product?.categoryId;
        if (catId && categoryStats[catId]) {
          categoryStats[catId].unitsSold += item.quantity;
          categoryStats[catId].revenue += item.lineTotal;
          categoryStats[catId].orderIds.add(order.id);
          totalCollectionRevenue += item.lineTotal;
        }
      }
    }

    for (const order of previousOrders) {
      for (const item of order.items) {
        const catId = item.product?.categoryId;
        if (catId && categoryStats[catId]) {
          categoryStats[catId].prevRevenue += item.lineTotal;
        }
      }
    }

    const collections = categories.map((cat) => {
      const stats = categoryStats[cat.id] || {
        unitsSold: 0,
        revenue: 0,
        orderIds: new Set<string>(),
        prevRevenue: 0,
      };
      const share =
        totalCollectionRevenue > 0
          ? Math.round((stats.revenue / totalCollectionRevenue) * 1000) / 10
          : 0;

      return {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        imageUrl: cat.imageUrl,
        activeProducts: cat.products.length,
        unitsSold: stats.unitsSold,
        revenue: stats.revenue,
        orderCount: stats.orderIds.size,
        sharePercentage: share,
        growthPercent: this.calculateGrowth(stats.revenue, stats.prevRevenue),
      };
    });

    // Rank collections
    const leaderboard = [...collections]
      .sort((a, b) => b.revenue - a.revenue)
      .map((item, index) => ({
        rank: index + 1,
        id: item.id,
        name: item.name,
        slug: item.slug,
        revenue: item.revenue,
        unitsSold: item.unitsSold,
        orderCount: item.orderCount,
      }));

    return { collections, leaderboard };
  }

  /**
   * 3. INVENTORY HEALTH
   */
  async getInventoryHealth(lowStockThreshold = 5): Promise<InventoryHealthDto> {
    const products = await this.prisma.db.product.findMany({
      where: { isActive: true },
      include: {
        inventory: true,
        category: { select: { id: true, name: true } },
        images: { where: { isPrimary: true }, take: 1 },
      },
      orderBy: { name: "asc" },
    });

    let inStockCount = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalAvailableUnits = 0;
    let totalReservedUnits = 0;

    const categoryMap: Record<string, { name: string; availableUnits: number; productCount: number }> = {};
    const lowStockAlerts: InventoryHealthDto["lowStockAlerts"] = [];
    const recommendations: InventoryHealthDto["recommendations"] = [];

    for (const p of products) {
      const qty = p.inventory?.quantity ?? 0;
      const reserved = p.inventory?.reservedQuantity ?? 0;
      totalAvailableUnits += qty;
      totalReservedUnits += reserved;

      const catId = p.category?.id || "other";
      const catName = p.category?.name || "Other Anime";
      if (!categoryMap[catId]) {
        categoryMap[catId] = { name: catName, availableUnits: 0, productCount: 0 };
      }
      categoryMap[catId].availableUnits += qty;
      categoryMap[catId].productCount += 1;

      if (qty === 0) {
        outOfStockCount++;
        lowStockAlerts.push({
          productId: p.id,
          name: p.name,
          slug: p.slug,
          sku: p.sku,
          imageUrl: p.images[0]?.imageUrl || null,
          availableStock: 0,
          threshold: lowStockThreshold,
          status: "OUT_OF_STOCK",
          categoryName: catName,
        });
        recommendations.push({
          productId: p.id,
          name: p.name,
          type: "out_of_stock",
          message: `${p.name} is completely out of stock. Immediate restock required to avoid missed orders.`,
          severity: "high",
        });
      } else if (qty <= lowStockThreshold) {
        lowStockCount++;
        lowStockAlerts.push({
          productId: p.id,
          name: p.name,
          slug: p.slug,
          sku: p.sku,
          imageUrl: p.images[0]?.imageUrl || null,
          availableStock: qty,
          threshold: lowStockThreshold,
          status: "LOW_STOCK",
          categoryName: catName,
        });
        recommendations.push({
          productId: p.id,
          name: p.name,
          type: "low_stock",
          message: `Only ${qty} units remaining for ${p.name} (threshold: ${lowStockThreshold}). Prepare inventory replenishment.`,
          severity: "medium",
        });
      } else {
        inStockCount++;
      }
    }

    const categoryDistribution = Object.entries(categoryMap).map(([id, data]) => ({
      categoryId: id,
      categoryName: data.name,
      availableUnits: data.availableUnits,
      productCount: data.productCount,
    }));

    return {
      totalActiveProducts: products.length,
      inStockCount,
      lowStockCount,
      outOfStockCount,
      totalAvailableUnits,
      totalReservedUnits,
      categoryDistribution,
      lowStockAlerts: lowStockAlerts.sort((a, b) => a.availableStock - b.availableStock),
      recommendations,
    };
  }

  /**
   * 4. ORDER FULFILMENT INFOGRAPHIC
   */
  async getOrderFulfilment(params: AnalyticsFilterParams): Promise<OrderFulfilmentDto> {
    const { current, previous } = this.resolveDateRanges(params);

    const [currentOrders, prevOrders] = await Promise.all([
      this.prisma.db.order.findMany({
        where: { createdAt: { gte: current.start, lte: current.end } },
        select: { orderStatus: true },
      }),
      this.prisma.db.order.findMany({
        where: { createdAt: { gte: previous.start, lte: previous.end } },
        select: { orderStatus: true },
      }),
    ]);

    const stageConfig: Array<{ status: any; label: string }> = [
      { status: "PENDING", label: "Pending Review" },
      { status: "CONFIRMED", label: "Confirmed" },
      { status: "PROCESSING", label: "Packing / Quality Check" },
      { status: "SHIPPED", label: "In Courier Transit" },
      { status: "DELIVERED", label: "Delivered & Paid" },
      { status: "CANCELLED", label: "Cancelled / Returned" },
    ];

    const currentCounts: Record<string, number> = {};
    const prevCounts: Record<string, number> = {};
    stageConfig.forEach((s) => {
      currentCounts[s.status] = 0;
      prevCounts[s.status] = 0;
    });

    currentOrders.forEach((o) => {
      if (currentCounts[o.orderStatus] !== undefined) currentCounts[o.orderStatus]++;
    });

    prevOrders.forEach((o) => {
      if (prevCounts[o.orderStatus] !== undefined) prevCounts[o.orderStatus]++;
    });

    const totalOrders = currentOrders.length;
    const stages = stageConfig.map((s) => {
      const count = currentCounts[s.status];
      const prevCount = prevCounts[s.status];
      const pct = totalOrders > 0 ? Math.round((count / totalOrders) * 1000) / 10 : 0;
      return {
        status: s.status,
        label: s.label,
        count,
        percentage: pct,
        changeFromPreviousPercent: this.calculateGrowth(count, prevCount),
      };
    });

    const cancellationRate =
      totalOrders > 0
        ? Math.round((currentCounts["CANCELLED"] / totalOrders) * 1000) / 10
        : 0;

    return {
      stages,
      cancellationRate,
      awaitingConfirmationCount: currentCounts["PENDING"],
      activeTransitCount: currentCounts["SHIPPED"] + currentCounts["PROCESSING"],
    };
  }

  /**
   * 5. PRODUCT LEADERBOARD
   */
  async getProductLeaderboard(params: AnalyticsFilterParams): Promise<ProductLeaderboardDto> {
    const { current } = this.resolveDateRanges(params);

    // Sales items in period
    const orderItems = await this.prisma.db.orderItem.findMany({
      where: {
        createdAt: { gte: current.start, lte: current.end },
        order: { orderStatus: { not: "CANCELLED" } },
      },
      include: {
        product: {
          include: {
            category: true,
            inventory: true,
            images: { where: { isPrimary: true }, take: 1 },
          },
        },
      },
    });

    const productSalesMap: Record<
      string,
      {
        name: string;
        sku: string;
        slug: string;
        categoryName: string;
        imageUrl: string | null;
        unitsSold: number;
        revenue: number;
        remainingStock: number;
      }
    > = {};

    for (const item of orderItems) {
      const pid = item.productId || item.sku;
      if (!productSalesMap[pid]) {
        productSalesMap[pid] = {
          name: item.productName,
          sku: item.sku,
          slug: item.product?.slug || item.sku.toLowerCase(),
          categoryName: item.product?.category?.name || "Anime",
          imageUrl: item.productImage || item.product?.images[0]?.imageUrl || null,
          unitsSold: 0,
          revenue: 0,
          remainingStock: item.product?.inventory?.quantity ?? 0,
        };
      }
      productSalesMap[pid].unitsSold += item.quantity;
      productSalesMap[pid].revenue += item.lineTotal;
    }

    const salesList = Object.entries(productSalesMap).map(([id, data]) => ({
      productId: id,
      ...data,
    }));

    const bestSelling = [...salesList]
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 10)
      .map((item, index) => ({ rank: index + 1, ...item }));

    const topRevenue = [...salesList]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
      .map((item, index) => ({ rank: index + 1, ...item }));

    // Wishlist counts
    const wishlistCounts = await this.prisma.db.wishlistItem.groupBy({
      by: ["productId"],
      _count: { productId: true },
      orderBy: { _count: { productId: "desc" } },
      take: 10,
    });

    const wishlistProductIds = wishlistCounts.map((w) => w.productId);
    const wishlistProducts = await this.prisma.db.product.findMany({
      where: { id: { in: wishlistProductIds } },
      include: {
        category: true,
        inventory: true,
        images: { where: { isPrimary: true }, take: 1 },
      },
    });

    const mostWishlisted = wishlistCounts.map((w, index) => {
      const p = wishlistProducts.find((prod) => prod.id === w.productId);
      return {
        rank: index + 1,
        productId: w.productId,
        name: p?.name || "Figure",
        slug: p?.slug || "",
        sku: p?.sku || "",
        imageUrl: p?.images[0]?.imageUrl || null,
        wishlistCount: w._count.productId,
        currentPrice: p?.price ?? 0,
        remainingStock: p?.inventory?.quantity ?? 0,
      };
    });

    return {
      bestSelling,
      topRevenue,
      mostWishlisted,
    };
  }

  /**
   * 6. CUSTOMER INSIGHTS
   */
  async getCustomerInsights(params: AnalyticsFilterParams): Promise<CustomerInsightsDto> {
    const { current } = this.resolveDateRanges(params);

    const [totalRegistered, newCustomers, orders] = await Promise.all([
      this.prisma.db.userProfile.count(),
      this.prisma.db.userProfile.count({
        where: { createdAt: { gte: current.start, lte: current.end } },
      }),
      this.prisma.db.order.findMany({
        where: { orderStatus: { not: "CANCELLED" } },
        select: {
          id: true,
          userId: true,
          totalAmount: true,
          addressSnapshot: true,
          createdAt: true,
          user: { select: { fullName: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Customer purchase counts
    const customerOrderCount: Record<string, { count: number; totalSpend: number }> = {};
    const districtSales: Record<string, { customerIds: Set<string>; orderCount: number; revenue: number }> = {};
    const recentActivity: CustomerInsightsDto["recentActivity"] = [];

    let currentPeriodOrdersCount = 0;
    const currentPeriodCustomerIds = new Set<string>();

    for (const order of orders) {
      if (!customerOrderCount[order.userId]) {
        customerOrderCount[order.userId] = { count: 0, totalSpend: 0 };
      }
      customerOrderCount[order.userId].count++;
      customerOrderCount[order.userId].totalSpend += order.totalAmount;

      const orderDate = new Date(order.createdAt);
      if (orderDate >= current.start && orderDate <= current.end) {
        currentPeriodOrdersCount++;
        currentPeriodCustomerIds.add(order.userId);
      }

      // District parsing
      const snap = order.addressSnapshot as any;
      const district = (snap?.district || "Dhaka").trim();
      if (!districtSales[district]) {
        districtSales[district] = { customerIds: new Set<string>(), orderCount: 0, revenue: 0 };
      }
      districtSales[district].customerIds.add(order.userId);
      districtSales[district].orderCount++;
      districtSales[district].revenue += order.totalAmount;

      if (recentActivity.length < 10) {
        recentActivity.push({
          id: order.id,
          type: "ORDER",
          customerName: order.user?.fullName || "Verified Collector",
          timestamp: order.createdAt.toISOString(),
          detail: `Placed order for ৳${order.totalAmount.toLocaleString()}`,
        });
      }
    }

    const payingCustomersCount = Object.keys(customerOrderCount).length;
    const repeatCustomers = Object.values(customerOrderCount).filter((c) => c.count > 1).length;
    const repeatPurchaseRate =
      payingCustomersCount > 0
        ? Math.round((repeatCustomers / payingCustomersCount) * 1000) / 10
        : 0;

    const ordersPerCustomerAvg =
      payingCustomersCount > 0
        ? Math.round((orders.length / payingCustomersCount) * 10) / 10
        : 0;

    const totalDistrictRev = Object.values(districtSales).reduce((acc, curr) => acc + curr.revenue, 0);

    const districts = Object.entries(districtSales)
      .map(([name, data]) => ({
        district: name,
        customerCount: data.customerIds.size,
        orderCount: data.orderCount,
        revenue: data.revenue,
        sharePercentage: totalDistrictRev > 0 ? Math.round((data.revenue / totalDistrictRev) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    return {
      totalRegistered,
      newCustomersInPeriod: newCustomers,
      returningCustomersInPeriod: currentPeriodCustomerIds.size - newCustomers > 0 ? currentPeriodCustomerIds.size - newCustomers : 0,
      purchasingCustomersCount: payingCustomersCount,
      repeatPurchaseRate,
      ordersPerCustomerAvg,
      districts,
      recentActivity,
    };
  }

  /**
   * 7. SALES CONVERSION FUNNEL
   */
  async getConversionFunnel(params: AnalyticsFilterParams): Promise<ConversionFunnelDto> {
    const { current } = this.resolveDateRanges(params);

    const isHistoricalUnavailable = current.end < this.trackingActivationDate;

    // Distinct sessions count
    const [
      sessionEvents,
      productViewEvents,
      cartEvents,
      checkoutEvents,
      actualOrdersCount,
    ] = await Promise.all([
      this.prisma.db.analyticsEvent.groupBy({
        by: ["sessionId"],
        where: {
          eventName: "storefront_session_started",
          createdAt: { gte: current.start, lte: current.end },
        },
      }),
      this.prisma.db.analyticsEvent.count({
        where: {
          eventName: "product_viewed",
          createdAt: { gte: current.start, lte: current.end },
        },
      }),
      this.prisma.db.analyticsEvent.count({
        where: {
          eventName: "add_to_cart",
          createdAt: { gte: current.start, lte: current.end },
        },
      }),
      this.prisma.db.analyticsEvent.count({
        where: {
          eventName: "checkout_started",
          createdAt: { gte: current.start, lte: current.end },
        },
      }),
      // Authoritative purchases from Order table
      this.prisma.db.order.count({
        where: {
          createdAt: { gte: current.start, lte: current.end },
          orderStatus: { not: "CANCELLED" },
        },
      }),
    ]);

    const totalSessions = sessionEvents.length;
    const stages = [
      {
        stageName: "1. Storefront Sessions",
        eventCount: totalSessions,
        stepConversionRate: 100,
        overallConversionRate: 100,
        dropOffRate: 0,
      },
      {
        stageName: "2. Product Detail Views",
        eventCount: productViewEvents,
        stepConversionRate: totalSessions > 0 ? Math.min(100, Math.round((productViewEvents / totalSessions) * 1000) / 10) : 0,
        overallConversionRate: totalSessions > 0 ? Math.min(100, Math.round((productViewEvents / totalSessions) * 1000) / 10) : 0,
        dropOffRate: totalSessions > productViewEvents ? Math.round(((totalSessions - productViewEvents) / totalSessions) * 1000) / 10 : 0,
      },
      {
        stageName: "3. Added to Bag",
        eventCount: cartEvents,
        stepConversionRate: productViewEvents > 0 ? Math.min(100, Math.round((cartEvents / productViewEvents) * 1000) / 10) : 0,
        overallConversionRate: totalSessions > 0 ? Math.min(100, Math.round((cartEvents / totalSessions) * 1000) / 10) : 0,
        dropOffRate: productViewEvents > cartEvents ? Math.round(((productViewEvents - cartEvents) / productViewEvents) * 1000) / 10 : 0,
      },
      {
        stageName: "4. Checkout Initiated",
        eventCount: checkoutEvents,
        stepConversionRate: cartEvents > 0 ? Math.min(100, Math.round((checkoutEvents / cartEvents) * 1000) / 10) : 0,
        overallConversionRate: totalSessions > 0 ? Math.min(100, Math.round((checkoutEvents / totalSessions) * 1000) / 10) : 0,
        dropOffRate: cartEvents > checkoutEvents ? Math.round(((cartEvents - checkoutEvents) / cartEvents) * 1000) / 10 : 0,
      },
      {
        stageName: "5. Completed Purchases",
        eventCount: actualOrdersCount,
        stepConversionRate: checkoutEvents > 0 ? Math.min(100, Math.round((actualOrdersCount / checkoutEvents) * 1000) / 10) : 0,
        overallConversionRate: totalSessions > 0 ? Math.min(100, Math.round((actualOrdersCount / totalSessions) * 1000) / 10) : 0,
        dropOffRate: checkoutEvents > actualOrdersCount ? Math.round(((checkoutEvents - actualOrdersCount) / checkoutEvents) * 1000) / 10 : 0,
      },
    ];

    return {
      trackingActivatedAt: this.trackingActivationDate.toISOString(),
      totalSessions,
      productViews: productViewEvents,
      addToCartEvents: cartEvents,
      checkoutStartedEvents: checkoutEvents,
      purchaseCompletedEvents: actualOrdersCount,
      stages,
      isHistoricalUnavailable,
    };
  }

  /**
   * First-party event ingestion
   */
  async trackEvent(dto: CreateAnalyticsEventDto) {
    // Sanitize metadata to avoid PII
    let safeMetadata = dto.metadata;
    if (safeMetadata && typeof safeMetadata === "object") {
      const sanitized = { ...safeMetadata };
      delete (sanitized as any).password;
      delete (sanitized as any).token;
      delete (sanitized as any).email;
      delete (sanitized as any).phone;
      delete (sanitized as any).fullAddress;
      safeMetadata = sanitized;
    }

    return this.prisma.db.analyticsEvent.create({
      data: {
        eventName: dto.eventName,
        sessionId: dto.sessionId.slice(0, 128),
        userId: dto.userId || null,
        productId: dto.productId || null,
        categoryId: dto.categoryId || null,
        metadata: safeMetadata || undefined,
      },
    });
  }
}

