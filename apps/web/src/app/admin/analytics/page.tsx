"use client";

import { useEffect, useState, useCallback } from "react";
import { authService } from "@/lib/auth-service";
import {
  getAnalyticsOverview,
  regenerateBusinessInsights,
} from "@/lib/commerce-api";
import { AnalyticsHeader } from "@/components/admin/analytics/AnalyticsHeader";
import { RevenueIntelligence } from "@/components/admin/analytics/RevenueIntelligence";
import { CollectionPerformance } from "@/components/admin/analytics/CollectionPerformance";
import { InventoryHealth } from "@/components/admin/analytics/InventoryHealth";
import { OrderFulfilmentPipeline } from "@/components/admin/analytics/OrderFulfilmentPipeline";
import { ProductLeaderboard } from "@/components/admin/analytics/ProductLeaderboard";
import { CustomerInsights } from "@/components/admin/analytics/CustomerInsights";
import { ConversionFunnel } from "@/components/admin/analytics/ConversionFunnel";
import { AIInsightsPanel } from "@/components/admin/analytics/AIInsightsPanel";
import { ExportReportModal } from "@/components/admin/analytics/ExportReportModal";
import type {
  AnalyticsFilterParams,
  AnalyticsOverviewDto,
} from "@himatu/shared";
import {
  DollarSign,
  Layers,
  Boxes,
  Users,
  Sparkles,
  TrendingUp,
  LayoutGrid,
} from "lucide-react";

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsOverviewDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AnalyticsFilterParams>({
    period: "last_30_days",
    compare: true,
  });
  const [activeTab, setActiveTab] = useState<
    "all" | "revenue" | "collections" | "inventory" | "funnel" | "ai"
  >("all");
  const [showExportModal, setShowExportModal] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const loadData = useCallback(async (currentFilters: AnalyticsFilterParams) => {
    try {
      setLoading(true);
      setError(null);
      const session = await authService.getSession();
      if (!session?.accessToken) {
        throw new Error("Administrative session expired. Please sign in again.");
      }
      const res = await getAnalyticsOverview(session.accessToken, currentFilters);
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load business intelligence data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(filters);
  }, [filters, loadData]);

  const handleFilterChange = (updated: Partial<AnalyticsFilterParams>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
  };

  const handleRegenerateAi = async () => {
    try {
      setIsGeneratingAi(true);
      const session = await authService.getSession();
      if (!session?.accessToken) return;
      const newInsights = await regenerateBusinessInsights(session.accessToken, filters);
      if (data) {
        setData({ ...data, insights: newInsights });
      }
    } catch (err) {
      console.error("AI Insight regeneration failed", err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const tabs = [
    { id: "all", label: "Executive Overview", icon: LayoutGrid },
    { id: "revenue", label: "Revenue & Finance", icon: DollarSign },
    { id: "collections", label: "Collections & Figures", icon: Layers },
    { id: "inventory", label: "Inventory Health", icon: Boxes },
    { id: "funnel", label: "Funnel & Customers", icon: Users },
    { id: "ai", label: "AI Business Insights", icon: Sparkles },
  ] as const;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. Analytics Header & Filter Toolbar */}
      <AnalyticsHeader
        filters={filters}
        onChange={handleFilterChange}
        onRefresh={() => loadData(filters)}
        onExport={() => setShowExportModal(true)}
        isLoading={loading}
      />

      {/* 2. Workspace View Tabs */}
      <div className="flex border-b border-neutral-200 overflow-x-auto no-scrollbar gap-1 text-xs font-semibold">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 border-b-2 whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? "border-black text-black font-bold"
                  : "border-transparent text-neutral-500 hover:text-neutral-900"
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Loading State */}
      {loading && !data && (
        <div className="py-24 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-neutral-900 border-r-transparent" />
          <p className="mt-3 text-xs font-bold uppercase tracking-wider text-neutral-500">
            Synthesizing Authentic Commerce Telemetry…
          </p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-xs text-rose-800">
          <p className="font-bold">Failed to load analytics</p>
          <p className="mt-1">{error}</p>
          <button
            type="button"
            onClick={() => loadData(filters)}
            className="mt-3 rounded bg-rose-800 px-3 py-1.5 font-semibold text-white hover:bg-rose-900"
          >
            Retry Analysis
          </button>
        </div>
      )}

      {/* 3. Render Modules Based on Tab */}
      {data && (
        <div className="space-y-8">
          {(activeTab === "all" || activeTab === "revenue") && (
            <section className="space-y-4">
              <RevenueIntelligence data={data.revenue} />
            </section>
          )}

          {(activeTab === "all" || activeTab === "collections") && (
            <section className="space-y-4">
              <CollectionPerformance data={data.collections} />
              <ProductLeaderboard data={data.products} />
            </section>
          )}

          {(activeTab === "all" || activeTab === "inventory") && (
            <section className="space-y-4">
              <InventoryHealth data={data.inventory} />
              <OrderFulfilmentPipeline data={data.orders} />
            </section>
          )}

          {(activeTab === "all" || activeTab === "funnel") && (
            <section className="space-y-4">
              <ConversionFunnel data={data.funnel} />
              <CustomerInsights data={data.customers} />
            </section>
          )}

          {(activeTab === "all" || activeTab === "ai") && (
            <section className="space-y-4">
              <AIInsightsPanel
                insights={data.insights}
                onRegenerate={handleRegenerateAi}
                isGenerating={isGeneratingAi}
              />
            </section>
          )}
        </div>
      )}

      {/* Export Report Modal */}
      {showExportModal && data && (
        <ExportReportModal data={data} onClose={() => setShowExportModal(false)} />
      )}
    </div>
  );
}
