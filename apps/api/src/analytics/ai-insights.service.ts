import { Inject, Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AnalyticsService } from "./analytics.service";
import type {
  AnalyticsFilterParams,
  BusinessInsightDto,
} from "@himatu/shared";

@Injectable()
export class AiInsightsService {
  private readonly logger = new Logger(AiInsightsService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AnalyticsService) private readonly analytics: AnalyticsService,
  ) {}

  /**
   * Main entry point: generate structured insights using available provider or deterministic rules
   */
  async generateInsights(params: AnalyticsFilterParams): Promise<BusinessInsightDto[]> {
    // 1. Gather strictly aggregated metrics (no PII or raw customer details)
    const [revenue, collections, inventory, orders, funnel] = await Promise.all([
      this.analytics.getRevenueIntelligence(params),
      this.analytics.getCollectionPerformance(params),
      this.analytics.getInventoryHealth(5),
      this.analytics.getOrderFulfilment(params),
      this.analytics.getConversionFunnel(params),
    ]);

    const apiKey = process.env.GEMINI_API_KEY;
    let insights: BusinessInsightDto[] = [];

    if (apiKey) {
      try {
        insights = await this.callGeminiProvider(apiKey, {
          period: params.period || "last_30_days",
          revenue,
          collections,
          inventory,
          orders,
          funnel,
        });
      } catch (err: any) {
        this.logger.warn(`AI Provider failed, falling back to deterministic rules: ${err.message}`);
        insights = this.generateDeterministicInsights(params.period || "last_30_days", {
          revenue,
          collections,
          inventory,
          orders,
          funnel,
        });
      }
    } else {
      insights = this.generateDeterministicInsights(params.period || "last_30_days", {
        revenue,
        collections,
        inventory,
        orders,
        funnel,
      });
    }

    // 2. Persist generated insights to database for audit trail
    try {
      for (const ins of insights) {
        await this.prisma.db.analyticsInsight.create({
          data: {
            title: ins.title,
            category: ins.category,
            summary: ins.summary,
            evidence: ins.evidence as any,
            recommendedAction: ins.recommendedAction,
            destination: ins.destination,
            source: ins.source,
            confidence: ins.confidence,
            reportingPeriod: params.period || "last_30_days",
          },
        });
      }
    } catch (persistErr) {
      this.logger.error("Failed to persist insight audit trail", persistErr);
    }

    return insights;
  }

  /**
   * Retrieve historical generated insights
   */
  async getInsightsHistory(limit = 20): Promise<BusinessInsightDto[]> {
    const records = await this.prisma.db.analyticsInsight.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return records.map((r) => ({
      id: r.id,
      title: r.title,
      category: r.category as any,
      summary: r.summary,
      evidence: r.evidence as any,
      recommendedAction: r.recommendedAction,
      destination: r.destination,
      source: r.source as any,
      confidence: r.confidence as any,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  /**
   * Gemini LLM Provider with strict JSON schema and numerical grounding
   */
  private async callGeminiProvider(apiKey: string, context: any): Promise<BusinessInsightDto[]> {
    const prompt = `You are the chief business intelligence analyst for HIMATU, a premium anime figures and collectibles store in Bangladesh.
Analyze the following authentic store metrics and generate 3 to 5 concise, actionable business insights.
CRITICAL RULES:
1. ONLY reference numbers provided in the metrics context below. Never hallucinate or invent financial values.
2. If a metric is 0 or unavailable, state that honestly.
3. Every insight must contain a valid destination path within HIMATU admin (e.g. /admin/inventory, /admin/orders, /admin/products, /admin/payments).
4. Return ONLY a valid JSON array of objects matching this exact structure:
[
  {
    "title": "Short title (under 8 words)",
    "category": "opportunity" | "warning" | "performance" | "recommendation",
    "summary": "1-2 sentence concise executive explanation grounded in the numbers",
    "evidence": {
      "metric": "name_of_metric",
      "value": "actual_numerical_or_string_value",
      "period": "reporting_period"
    },
    "recommendedAction": "Clear 1-sentence recommended operational action",
    "destination": "/admin/..."
  }
]

METRICS CONTEXT:
${JSON.stringify(context, null, 2)}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
          },
        }),
      },
    );

    if (!res.ok) {
      throw new Error(`Gemini API returned status ${res.status}`);
    }

    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error("Empty response from Gemini API");

    const parsed = JSON.parse(rawText);
    if (!Array.isArray(parsed)) throw new Error("Parsed Gemini response is not an array");

    return parsed.map((item, idx) => ({
      id: `ai-${Date.now()}-${idx}`,
      title: String(item.title || "Business Observation"),
      category: ["opportunity", "warning", "performance", "recommendation"].includes(item.category)
        ? item.category
        : "performance",
      summary: String(item.summary || ""),
      evidence: item.evidence || { metric: "general", value: "N/A", period: context.period },
      recommendedAction: String(item.recommendedAction || "Review store metrics"),
      destination: String(item.destination || "/admin"),
      source: "ai-generated",
      confidence: "high",
      createdAt: new Date().toISOString(),
    }));
  }

  /**
   * Deterministic Rule-Based Intelligence Grounded in Live Database Metrics
   */
  private generateDeterministicInsights(period: string, data: any): BusinessInsightDto[] {
    const insights: BusinessInsightDto[] = [];
    const nowIso = new Date().toISOString();

    const { revenue, collections, inventory, orders, funnel } = data;

    // 1. Inventory Alert Insight
    if (inventory.outOfStockCount > 0 || inventory.lowStockCount > 0) {
      const topAlert = inventory.lowStockAlerts[0];
      insights.push({
        id: `rule-inv-${Date.now()}`,
        title: inventory.outOfStockCount > 0 ? "Depleted Inventory Detected" : "Low Stock Alert on Key Figures",
        category: "warning",
        summary: inventory.outOfStockCount > 0
          ? `${inventory.outOfStockCount} figurine(s) are completely out of stock (${topAlert?.name || "Popular figures"}), risking customer abandonment.`
          : `${inventory.lowStockCount} figurine(s) have fallen below the 5-unit threshold. Restock recommended to maintain momentum.`,
        evidence: {
          metric: "low_stock_products",
          value: inventory.outOfStockCount + inventory.lowStockCount,
          period,
          context: `Threshold: 5 units. Top constrained: ${topAlert?.name || "Figures"} (${topAlert?.availableStock || 0} units left).`,
        },
        recommendedAction: "Review depleted figures and trigger supplier replenishment orders.",
        destination: "/admin/inventory",
        source: "rule-based",
        confidence: "high",
        createdAt: nowIso,
      });
    }

    // 2. Collection Dominance Insight
    if (collections.leaderboard && collections.leaderboard.length > 0) {
      const topCol = collections.leaderboard[0];
      const share = collections.collections.find((c: any) => c.id === topCol.id)?.sharePercentage ?? 0;
      if (topCol.revenue > 0) {
        insights.push({
          id: `rule-col-${Date.now()}`,
          title: `${topCol.name} Dominates Sales Revenue`,
          category: "performance",
          summary: `${topCol.name} leads the store generating ৳${topCol.revenue.toLocaleString()} (${share}% of collection revenue) with ${topCol.unitsSold} units sold.`,
          evidence: {
            metric: "collection_revenue",
            value: `৳${topCol.revenue.toLocaleString()}`,
            period,
            context: `${topCol.unitsSold} units across ${topCol.orderCount} orders.`,
          },
          recommendedAction: `Feature additional ${topCol.name} scale figures on the homepage hero showcase.`,
          destination: `/admin/categories`,
          source: "rule-based",
          confidence: "high",
          createdAt: nowIso,
        });
      }
    }

    // 3. COD vs Collected Revenue Insight
    if (revenue.pendingCodRevenue > 0) {
      const pendingShare =
        revenue.grossOrderValue > 0
          ? Math.round((revenue.pendingCodRevenue / revenue.grossOrderValue) * 100)
          : 0;

      insights.push({
        id: `rule-rev-${Date.now()}`,
        title: "Cash on Delivery Settlement Pending",
        category: pendingShare > 40 ? "warning" : "opportunity",
        summary: `৳${revenue.pendingCodRevenue.toLocaleString()} (${pendingShare}% of Gross Order Value) is currently pending collection upon delivery across open shipments.`,
        evidence: {
          metric: "pending_cod_revenue",
          value: `৳${revenue.pendingCodRevenue.toLocaleString()}`,
          period,
          context: `Collected: ৳${revenue.collectedRevenue.toLocaleString()} | Gross: ৳${revenue.grossOrderValue.toLocaleString()}`,
        },
        recommendedAction: "Verify recipient delivery phone numbers and monitor courier delivery velocity to accelerate settlement.",
        destination: "/admin/orders",
        source: "rule-based",
        confidence: "high",
        createdAt: nowIso,
      });
    }

    // 4. Order Fulfilment Pipeline Insight
    if (orders.awaitingConfirmationCount > 0) {
      insights.push({
        id: `rule-ord-${Date.now()}`,
        title: "Customer Orders Awaiting Confirmation",
        category: "recommendation",
        summary: `${orders.awaitingConfirmationCount} new order(s) are currently in Pending Review stage and require owner confirmation to dispatch.`,
        evidence: {
          metric: "awaiting_confirmation_orders",
          value: orders.awaitingConfirmationCount,
          period,
          context: `Cancellation rate is held at ${orders.cancellationRate}%.`,
        },
        recommendedAction: "Review and confirm pending orders to meet same-day courier dispatch windows.",
        destination: "/admin/orders?status=PENDING",
        source: "rule-based",
        confidence: "high",
        createdAt: nowIso,
      });
    }

    // 5. Conversion Funnel Insight
    if (funnel.totalSessions > 0) {
      const viewToCartRate = funnel.stages[2]?.stepConversionRate ?? 0;
      insights.push({
        id: `rule-fun-${Date.now()}`,
        title: "Storefront Browsing Engagement",
        category: "opportunity",
        summary: `Storefront has recorded ${funnel.totalSessions} unique sessions and ${funnel.productViews} figure detail views. Cart conversion rate stands at ${viewToCartRate}%.`,
        evidence: {
          metric: "funnel_conversion",
          value: `${viewToCartRate}% View-to-Cart`,
          period,
          context: `${funnel.addToCartEvents} add-to-bag events recorded since event tracking was activated.`,
        },
        recommendedAction: "Optimize product gallery zoom and highlight free shipping threshold to convert browsers into buyers.",
        destination: "/admin/products",
        source: "rule-based",
        confidence: "medium",
        createdAt: nowIso,
      });
    } else {
      insights.push({
        id: `rule-fun-init-${Date.now()}`,
        title: "First-Party Event Tracking Active",
        category: "opportunity",
        summary: "First-party storefront session and conversion tracking is now live. Real-time conversion drop-off curves will populate as traffic browses.",
        evidence: {
          metric: "tracking_status",
          value: "Active",
          period,
          context: `Activated: ${funnel.trackingActivatedAt}`,
        },
        recommendedAction: "Browse storefront collections to verify telemetry ingestion.",
        destination: "/admin/analytics",
        source: "rule-based",
        confidence: "high",
        createdAt: nowIso,
      });
    }

    return insights;
  }
}

