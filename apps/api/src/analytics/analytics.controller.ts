import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { Roles, RolesGuard } from "../auth/roles";
import { AnalyticsService } from "./analytics.service";
import { AiInsightsService } from "./ai-insights.service";
import type {
  AnalyticsFilterParams,
  AnalyticsOverviewDto,
  CreateAnalyticsEventDto,
} from "@himatu/shared";

/**
 * Public Telemetry Ingestion Controller
 * Maps to /api/v1/analytics/events
 */
@Controller("analytics")
export class TelemetryController {
  constructor(@Inject(AnalyticsService) private readonly analytics: AnalyticsService) {}

  @Post("events")
  @HttpCode(HttpStatus.ACCEPTED)
  async ingestEvent(@Body() dto: CreateAnalyticsEventDto) {
    if (!dto || !dto.eventName || !dto.sessionId) {
      return { status: "ignored" };
    }
    await this.analytics.trackEvent(dto);
    return { status: "recorded" };
  }
}

/**
 * Admin Business Intelligence Controller
 * Maps to /api/v1/admin/analytics/*
 */
@Controller("admin/analytics")
@UseGuards(AuthGuard, RolesGuard)
@Roles("ADMIN")
export class AnalyticsController {
  constructor(
    @Inject(AnalyticsService) private readonly analytics: AnalyticsService,
    @Inject(AiInsightsService) private readonly insights: AiInsightsService,
  ) {}

  /**
   * Unified Business Intelligence Overview
   * GET /api/v1/admin/analytics/overview
   */
  @Get("overview")
  async getOverview(@Query() query: AnalyticsFilterParams): Promise<AnalyticsOverviewDto> {
    const [
      revenue,
      collections,
      inventory,
      orders,
      products,
      customers,
      funnel,
      insightsList,
    ] = await Promise.all([
      this.analytics.getRevenueIntelligence(query),
      this.analytics.getCollectionPerformance(query),
      this.analytics.getInventoryHealth(5),
      this.analytics.getOrderFulfilment(query),
      this.analytics.getProductLeaderboard(query),
      this.analytics.getCustomerInsights(query),
      this.analytics.getConversionFunnel(query),
      this.insights.generateInsights(query),
    ]);

    return {
      revenue,
      collections,
      inventory,
      orders,
      products,
      customers,
      funnel,
      insights: insightsList,
    };
  }

  /**
   * Revenue Intelligence
   * GET /api/v1/admin/analytics/revenue
   */
  @Get("revenue")
  async getRevenue(@Query() query: AnalyticsFilterParams) {
    return this.analytics.getRevenueIntelligence(query);
  }

  /**
   * Collection Performance
   * GET /api/v1/admin/analytics/collections
   */
  @Get("collections")
  async getCollections(@Query() query: AnalyticsFilterParams) {
    return this.analytics.getCollectionPerformance(query);
  }

  /**
   * Inventory Health
   * GET /api/v1/admin/analytics/inventory
   */
  @Get("inventory")
  async getInventory(@Query("threshold") threshold?: string) {
    const num = threshold ? parseInt(threshold, 10) : 5;
    return this.analytics.getInventoryHealth(isNaN(num) ? 5 : num);
  }

  /**
   * Order Fulfilment Infographic
   * GET /api/v1/admin/analytics/orders
   */
  @Get("orders")
  async getOrders(@Query() query: AnalyticsFilterParams) {
    return this.analytics.getOrderFulfilment(query);
  }

  /**
   * Product Leaderboard
   * GET /api/v1/admin/analytics/products
   */
  @Get("products")
  async getProducts(@Query() query: AnalyticsFilterParams) {
    return this.analytics.getProductLeaderboard(query);
  }

  /**
   * Customer Insights
   * GET /api/v1/admin/analytics/customers
   */
  @Get("customers")
  async getCustomers(@Query() query: AnalyticsFilterParams) {
    return this.analytics.getCustomerInsights(query);
  }

  /**
   * Conversion Funnel
   * GET /api/v1/admin/analytics/funnel
   */
  @Get("funnel")
  async getFunnel(@Query() query: AnalyticsFilterParams) {
    return this.analytics.getConversionFunnel(query);
  }

  /**
   * Business Insights
   * GET /api/v1/admin/analytics/insights
   */
  @Get("insights")
  async getInsights(@Query() query: AnalyticsFilterParams) {
    return this.insights.generateInsights(query);
  }

  /**
   * Trigger Re-generation of AI Insights
   * POST /api/v1/admin/analytics/insights/generate
   */
  @Post("insights/generate")
  async regenerateInsights(@Body() body: AnalyticsFilterParams) {
    return this.insights.generateInsights(body || {});
  }

  /**
   * Insights History
   * GET /api/v1/admin/analytics/insights/history
   */
  @Get("insights/history")
  async getInsightsHistory(@Query("limit") limit?: string) {
    const parsed = limit ? parseInt(limit, 10) : 20;
    return this.insights.getInsightsHistory(isNaN(parsed) ? 20 : parsed);
  }
}
