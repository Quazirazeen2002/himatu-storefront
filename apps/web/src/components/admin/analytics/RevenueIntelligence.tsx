"use client";

import { useState } from "react";
import {
  TrendingUp,
  DollarSign,
  Clock,
  ShoppingBag,
  Percent,
  HelpCircle,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import type { RevenueIntelligenceDto } from "@himatu/shared";

interface RevenueIntelligenceProps {
  data: RevenueIntelligenceDto;
  currency?: string;
}

export function RevenueIntelligence({ data, currency = "৳" }: RevenueIntelligenceProps) {
  const [metricMode, setMetricMode] = useState<"collected" | "gross">("collected");
  const [hoveredPoint, setHoveredPoint] = useState<any | null>(null);

  const {
    grossOrderValue,
    collectedRevenue,
    pendingCodRevenue,
    averageOrderValue,
    totalOrders,
    cancelledOrders,
    comparison,
    trendPoints,
    paymentMethods,
  } = data;

  // Chart scaling calculations
  const maxVal = Math.max(
    ...trendPoints.map((p) => (metricMode === "collected" ? p.collected : p.gross)),
    1000,
  );

  const chartWidth = 600;
  const chartHeight = 220;
  const paddingX = 40;
  const paddingY = 25;

  const pointsCount = trendPoints.length;
  const xStep = pointsCount > 1 ? (chartWidth - paddingX * 2) / (pointsCount - 1) : 0;

  const getCoordinates = (val: number, idx: number) => {
    const x = paddingX + idx * xStep;
    const y = chartHeight - paddingY - (val / maxVal) * (chartHeight - paddingY * 2);
    return { x, y };
  };

  const pathD = trendPoints
    .map((p, idx) => {
      const val = metricMode === "collected" ? p.collected : p.gross;
      const { x, y } = getCoordinates(val, idx);
      return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  const areaD = pathD
    ? `${pathD} L ${paddingX + (pointsCount - 1) * xStep} ${chartHeight - paddingY} L ${paddingX} ${chartHeight - paddingY} Z`
    : "";

  return (
    <div className="space-y-6">
      {/* 1. Six Financial KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* Gross Order Value */}
        <div className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Gross Order Value</span>
            <div className="group relative cursor-pointer" title="Sum of all non-cancelled order totals">
              <HelpCircle size={13} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-neutral-900">
            {currency}{grossOrderValue.toLocaleString()}
          </p>
          <div className="mt-2 flex items-center text-xs">
            {comparison.govChangePercent !== null ? (
              <span className={`inline-flex items-center font-bold ${comparison.govChangePercent >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {comparison.govChangePercent >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                {comparison.govChangePercent}%
              </span>
            ) : (
              <span className="text-neutral-400 font-medium">New Baseline</span>
            )}
            <span className="ml-1 text-neutral-400">vs prev</span>
          </div>
        </div>

        {/* Collected Revenue */}
        <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/20 p-5 shadow-sm">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-[11px] font-bold uppercase tracking-wider">Collected Revenue</span>
            <div className="group relative cursor-pointer" title="Settled payments (Delivered or Paid orders). Excludes pending COD.">
              <HelpCircle size={13} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-950">
            {currency}{collectedRevenue.toLocaleString()}
          </p>
          <div className="mt-2 flex items-center text-xs">
            {comparison.collectedChangePercent !== null ? (
              <span className={`inline-flex items-center font-bold ${comparison.collectedChangePercent >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {comparison.collectedChangePercent >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                {comparison.collectedChangePercent}%
              </span>
            ) : (
              <span className="text-neutral-400 font-medium">New Baseline</span>
            )}
            <span className="ml-1 text-neutral-400">vs prev</span>
          </div>
        </div>

        {/* Pending COD Amount */}
        <div className="rounded-xl border border-amber-200/70 bg-amber-50/20 p-5 shadow-sm">
          <div className="flex items-center justify-between text-amber-800">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pending COD</span>
            <div className="group relative cursor-pointer" title="Orders awaiting courier delivery and cash collection at doorstep.">
              <Clock size={13} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-amber-950">
            {currency}{pendingCodRevenue.toLocaleString()}
          </p>
          <p className="mt-2 text-xs text-neutral-500">
            {grossOrderValue > 0 ? Math.round((pendingCodRevenue / grossOrderValue) * 100) : 0}% of order value
          </p>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Average Order Value</span>
            <div className="group relative cursor-pointer" title="Gross Order Value divided by qualifying valid orders.">
              <Percent size={13} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-neutral-900">
            {currency}{averageOrderValue.toLocaleString()}
          </p>
          <div className="mt-2 flex items-center text-xs">
            {comparison.aovChangePercent !== null ? (
              <span className={`inline-flex items-center font-bold ${comparison.aovChangePercent >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {comparison.aovChangePercent >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                {comparison.aovChangePercent}%
              </span>
            ) : (
              <span className="text-neutral-400 font-medium">—</span>
            )}
            <span className="ml-1 text-neutral-400">vs prev</span>
          </div>
        </div>

        {/* Total Qualifying Orders */}
        <div className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Valid Orders</span>
            <ShoppingBag size={13} />
          </div>
          <p className="mt-2 text-2xl font-black text-neutral-900">{totalOrders}</p>
          <p className="mt-2 text-xs text-neutral-500">
            {cancelledOrders > 0 ? `${cancelledOrders} cancelled excluded` : "Zero cancellations"}
          </p>
        </div>

        {/* Net Period Growth */}
        <div className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Growth Delta</span>
            <TrendingUp size={13} />
          </div>
          <p className={`mt-2 text-2xl font-black ${comparison.collectedChangeAbsolute >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            {comparison.collectedChangeAbsolute >= 0 ? "+" : ""}
            {currency}{Math.abs(comparison.collectedChangeAbsolute).toLocaleString()}
          </p>
          <p className="mt-2 text-xs text-neutral-500">{comparison.previousPeriodLabel}</p>
        </div>
      </div>

      {/* 2. Interactive Revenue Trend & Payment Distribution */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Trend Line/Area Chart */}
        <div className="rounded-xl border border-neutral-200/80 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-900">
                Revenue Trajectory & Velocity
              </h2>
              <p className="text-xs text-neutral-500">
                {metricMode === "collected"
                  ? "Plotting confirmed collected cash receipts over time"
                  : "Plotting total gross order value placed by customers"}
              </p>
            </div>

            {/* Metric Mode Switcher */}
            <div className="inline-flex rounded-lg border border-neutral-200 bg-neutral-50 p-0.5">
              <button
                type="button"
                onClick={() => setMetricMode("collected")}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                  metricMode === "collected"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                Collected Cash
              </button>
              <button
                type="button"
                onClick={() => setMetricMode("gross")}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                  metricMode === "gross"
                    ? "bg-neutral-900 text-white shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                Gross Order Value
              </button>
            </div>
          </div>

          {/* SVG Chart */}
          <div className="mt-6 relative">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-56 overflow-visible">
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={metricMode === "collected" ? "#10b981" : "#111111"}
                    stopOpacity="0.25"
                  />
                  <stop
                    offset="100%"
                    stopColor={metricMode === "collected" ? "#10b981" : "#111111"}
                    stopOpacity="0.0"
                  />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                const y = chartHeight - paddingY - pct * (chartHeight - paddingY * 2);
                return (
                  <g key={i}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={chartWidth - paddingX}
                      y2={y}
                      stroke="#f1f2f4"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={paddingX - 8}
                      y={y + 3}
                      textAnchor="end"
                      fontSize="9"
                      fill="#9ca3af"
                      fontFamily="sans-serif"
                    >
                      {currency}{Math.round((maxVal * pct) / 1000)}k
                    </text>
                  </g>
                );
              })}

              {/* Filled Area */}
              {areaD && <path d={areaD} fill="url(#revenueGradient)" />}

              {/* Main Line */}
              {pathD && (
                <path
                  d={pathD}
                  fill="none"
                  stroke={metricMode === "collected" ? "#10b981" : "#111111"}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Interactive Circles */}
              {trendPoints.map((p, idx) => {
                const val = metricMode === "collected" ? p.collected : p.gross;
                const { x, y } = getCoordinates(val, idx);
                const isHovered = hoveredPoint?.date === p.date;
                return (
                  <g key={p.date}>
                    <circle
                      cx={x}
                      cy={y}
                      r={isHovered ? 5 : 3}
                      fill={metricMode === "collected" ? "#10b981" : "#111111"}
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      className="cursor-pointer transition-all"
                      onMouseEnter={() => setHoveredPoint(p)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredPoint && (
              <div className="absolute top-2 right-4 rounded-lg border border-neutral-200 bg-white p-2.5 shadow-md text-xs">
                <p className="font-bold text-neutral-900">{hoveredPoint.date}</p>
                <p className="text-emerald-700">Collected: {currency}{hoveredPoint.collected.toLocaleString()}</p>
                <p className="text-neutral-600">Gross Value: {currency}{hoveredPoint.gross.toLocaleString()}</p>
                <p className="text-neutral-500">{hoveredPoint.orders} order(s)</p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Method Distribution */}
        <div className="rounded-xl border border-neutral-200/80 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-900">
              Payment Method Breakdown
            </h2>
            <p className="text-xs text-neutral-500">
              Distribution of order volume across checkout settlement channels
            </p>

            <div className="mt-6 space-y-4">
              {paymentMethods.length > 0 ? (
                paymentMethods.map((pm) => (
                  <div key={pm.method} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-neutral-800">{pm.name}</span>
                      <span className="font-bold text-neutral-900">
                        {currency}{pm.amount.toLocaleString()} ({pm.sharePercentage}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-neutral-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pm.sharePercentage}%`,
                          backgroundColor: pm.method === "COD" ? "#111111" : "#10b981",
                        }}
                      />
                    </div>
                    <p className="text-[11px] text-neutral-400">{pm.count} total transaction(s)</p>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-neutral-400">
                  No payment records in selected period.
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 rounded-lg bg-neutral-50 p-3 text-[11px] text-neutral-600 border border-neutral-200/60">
            <span className="font-bold text-neutral-900">COD Settlement Policy:</span> Cash on Delivery orders remain in pending receivables until courier delivery is confirmed.
          </div>
        </div>
      </div>
    </div>
  );
}

