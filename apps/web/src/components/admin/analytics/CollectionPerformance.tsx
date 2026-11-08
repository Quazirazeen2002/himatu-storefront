"use client";

import { useState } from "react";
import {
  Layers,
  TrendingUp,
  Package,
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from "lucide-react";
import type { CollectionPerformanceDto } from "@himatu/shared";

interface CollectionPerformanceProps {
  data: CollectionPerformanceDto;
  currency?: string;
}

export function CollectionPerformance({ data, currency = "৳" }: CollectionPerformanceProps) {
  const [sortMetric, setSortMetric] = useState<"revenue" | "unitsSold" | "orderCount">("revenue");

  const { collections, leaderboard } = data;

  const sortedLeaderboard = [...leaderboard].sort((a, b) => b[sortMetric] - a[sortMetric]);
  const maxRevenue = Math.max(...collections.map((c) => c.revenue), 1000);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-black uppercase tracking-tight text-neutral-900">
            Anime Universe Performance
          </h2>
          <p className="text-xs text-neutral-500">
            Contribution, sales velocity, and growth across authentic collectible categories.
          </p>
        </div>

        {/* Sort Switcher */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-neutral-500 font-medium">Rank by:</span>
          <div className="inline-flex rounded-lg border border-neutral-200 bg-neutral-50 p-0.5">
            <button
              type="button"
              onClick={() => setSortMetric("revenue")}
              className={`rounded-md px-2.5 py-1 font-semibold transition ${
                sortMetric === "revenue"
                  ? "bg-neutral-900 text-white"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              Revenue
            </button>
            <button
              type="button"
              onClick={() => setSortMetric("unitsSold")}
              className={`rounded-md px-2.5 py-1 font-semibold transition ${
                sortMetric === "unitsSold"
                  ? "bg-neutral-900 text-white"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              Units Sold
            </button>
            <button
              type="button"
              onClick={() => setSortMetric("orderCount")}
              className={`rounded-md px-2.5 py-1 font-semibold transition ${
                sortMetric === "orderCount"
                  ? "bg-neutral-900 text-white"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              Orders
            </button>
          </div>
        </div>
      </div>

      {/* 1. Collection Performance Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {collections.map((col) => (
          <div
            key={col.id}
            className="rounded-xl border border-neutral-200/80 bg-white p-4 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-900 truncate" title={col.name}>
                  {col.name}
                </span>
                <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-bold text-neutral-600">
                  {col.activeProducts} figures
                </span>
              </div>
              <p className="mt-3 text-lg font-black text-neutral-900">
                {currency}{col.revenue.toLocaleString()}
              </p>
              <p className="text-[11px] text-neutral-500">
                {col.unitsSold} units • {col.sharePercentage}% share
              </p>
            </div>

            <div className="mt-3 pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px]">
              <span className="text-neutral-400">Growth:</span>
              {col.growthPercent !== null ? (
                <span
                  className={`inline-flex items-center font-bold ${
                    col.growthPercent >= 0 ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {col.growthPercent >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                  {col.growthPercent}%
                </span>
              ) : (
                <span className="text-neutral-400 font-medium">New</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 2. Collection Comparison & Leaderboard */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Horizontal Bar Chart */}
        <div className="rounded-xl border border-neutral-200/80 bg-white p-6 shadow-sm lg:col-span-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-4">
            Collection Revenue & Contribution Bars
          </h3>
          <div className="space-y-4">
            {collections.map((col) => {
              const widthPct = maxRevenue > 0 ? Math.round((col.revenue / maxRevenue) * 100) : 0;
              return (
                <div key={col.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-neutral-800">{col.name}</span>
                    <span className="font-semibold text-neutral-900">
                      {currency}{col.revenue.toLocaleString()} ({col.sharePercentage}%)
                    </span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-neutral-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-neutral-900 transition-all duration-500"
                      style={{ width: `${Math.max(widthPct, 2)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-neutral-400">
                    <span>{col.unitsSold} units shipped</span>
                    <span>{col.orderCount} customer orders</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Collection Leaderboard */}
        <div className="rounded-xl border border-neutral-200/80 bg-white p-6 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-4 flex items-center justify-between">
            <span>Universe Ranking</span>
            <Sparkles size={13} className="text-amber-500" />
          </h3>
          <div className="space-y-3">
            {sortedLeaderboard.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-neutral-100 p-2.5 transition hover:bg-neutral-50"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black ${
                      index === 0
                        ? "bg-amber-400 text-neutral-900"
                        : index === 1
                        ? "bg-neutral-300 text-neutral-900"
                        : index === 2
                        ? "bg-amber-700 text-white"
                        : "bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-neutral-900">{item.name}</p>
                    <p className="text-[10px] text-neutral-400">{item.unitsSold} units sold</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-neutral-900">
                    {currency}{item.revenue.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-neutral-400">{item.orderCount} orders</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

