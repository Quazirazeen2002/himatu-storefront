"use client";

import Link from "next/link";
import {
  Boxes,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import type { InventoryHealthDto } from "@himatu/shared";

interface InventoryHealthProps {
  data: InventoryHealthDto;
}

export function InventoryHealth({ data }: InventoryHealthProps) {
  const {
    totalActiveProducts,
    inStockCount,
    lowStockCount,
    outOfStockCount,
    totalAvailableUnits,
    totalReservedUnits,
    categoryDistribution,
    lowStockAlerts,
    recommendations,
  } = data;

  const totalCatalogUnits = totalAvailableUnits + totalReservedUnits;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-black uppercase tracking-tight text-neutral-900">
          Inventory Intelligence & Health
        </h2>
        <p className="text-xs text-neutral-500">
          Stock level surveillance, low-inventory alerts, and stock allocations across anime universes.
        </p>
      </div>

      {/* 1. Four Inventory KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Active Catalog */}
        <div className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Figures</span>
            <Boxes size={14} />
          </div>
          <p className="mt-2 text-2xl font-black text-neutral-900">{totalActiveProducts}</p>
          <p className="mt-1 text-xs text-neutral-500">
            {totalAvailableUnits} available units in showroom
          </p>
        </div>

        {/* Healthy Stock */}
        <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/20 p-5 shadow-sm">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-[11px] font-bold uppercase tracking-wider">In Stock (&gt; 5)</span>
            <CheckCircle2 size={14} />
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-950">{inStockCount}</p>
          <p className="mt-1 text-xs text-emerald-700 font-medium">Healthy inventory level</p>
        </div>

        {/* Low Stock Warning */}
        <div className="rounded-xl border border-amber-200/70 bg-amber-50/20 p-5 shadow-sm">
          <div className="flex items-center justify-between text-amber-800">
            <span className="text-[11px] font-bold uppercase tracking-wider">Low Stock (≤ 5)</span>
            <AlertTriangle size={14} />
          </div>
          <p className="mt-2 text-2xl font-black text-amber-950">{lowStockCount}</p>
          <p className="mt-1 text-xs text-amber-700 font-medium">Requires replenishment soon</p>
        </div>

        {/* Out of Stock Alert */}
        <div className="rounded-xl border border-rose-200/70 bg-rose-50/20 p-5 shadow-sm">
          <div className="flex items-center justify-between text-rose-800">
            <span className="text-[11px] font-bold uppercase tracking-wider">Out of Stock (0)</span>
            <XCircle size={14} />
          </div>
          <p className="mt-2 text-2xl font-black text-rose-950">{outOfStockCount}</p>
          <p className="mt-1 text-xs text-rose-700 font-medium">
            {outOfStockCount > 0 ? "Immediate restock required" : "Zero depleted figures"}
          </p>
        </div>
      </div>

      {/* 2. Low Stock Alerts & Recommendations Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Ranked Low Stock Alerts Table */}
        <div className="rounded-xl border border-neutral-200/80 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-1.5">
                <ShieldAlert size={14} className="text-amber-500" />
                <span>Restock Action List</span>
              </h3>
              <p className="text-[11px] text-neutral-500">
                Figures operating at or below the minimum safe threshold
              </p>
            </div>
            <Link
              href="/admin/inventory"
              className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-900 hover:text-black hover:underline"
            >
              <span>Manage Stock</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            {lowStockAlerts.length > 0 ? (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-100 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    <th className="pb-2.5">Figurine</th>
                    <th className="pb-2.5">Universe</th>
                    <th className="pb-2.5 text-center">Stock</th>
                    <th className="pb-2.5 text-center">Status</th>
                    <th className="pb-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {lowStockAlerts.map((item) => (
                    <tr key={item.productId} className="hover:bg-neutral-50/50">
                      <td className="py-3">
                        <div className="flex items-center gap-2.5">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="h-8 w-8 rounded object-cover border border-neutral-200"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded bg-neutral-100 flex items-center justify-center text-neutral-400 text-[10px]">
                              N/A
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-neutral-900 truncate max-w-[200px]" title={item.name}>
                              {item.name}
                            </p>
                            <p className="text-[10px] text-neutral-400 font-mono">{item.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-neutral-600">{item.categoryName}</td>
                      <td className="py-3 text-center font-bold text-neutral-900">
                        {item.availableStock}
                      </td>
                      <td className="py-3 text-center">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                            item.status === "OUT_OF_STOCK"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {item.status === "OUT_OF_STOCK" ? "Depleted" : "Low Stock"}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <Link
                          href={`/admin/inventory?search=${encodeURIComponent(item.sku)}`}
                          className="rounded border border-neutral-200 bg-white px-2 py-1 text-[11px] font-semibold text-neutral-700 hover:bg-neutral-50 shadow-xs"
                        >
                          Update Stock
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-8 text-center text-xs text-neutral-400">
                All figurines are currently above the minimum threshold.
              </div>
            )}
          </div>
        </div>

        {/* Category Units Distribution & Operational Recommendations */}
        <div className="rounded-xl border border-neutral-200/80 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-4">
              Physical Stock by Collection
            </h3>
            <div className="space-y-3">
              {categoryDistribution.map((cat) => (
                <div key={cat.categoryId} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-neutral-800">{cat.categoryName}</span>
                    <span className="font-bold text-neutral-900">
                      {cat.availableUnits} units ({cat.productCount} figures)
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-neutral-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-neutral-900"
                      style={{
                        width: `${
                          totalAvailableUnits > 0
                            ? Math.round((cat.availableUnits / totalAvailableUnits) * 100)
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Deterministic Inventory Advice */}
          <div className="mt-6 pt-4 border-t border-neutral-100">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
              Automated Inventory Rules
            </h4>
            <div className="space-y-2">
              {recommendations.slice(0, 2).map((rec, i) => (
                <div
                  key={i}
                  className={`rounded-lg p-2.5 text-xs ${
                    rec.severity === "high"
                      ? "bg-rose-50 text-rose-900 border border-rose-100"
                      : "bg-amber-50 text-amber-900 border border-amber-100"
                  }`}
                >
                  <p className="font-bold">{rec.name}</p>
                  <p className="mt-0.5 text-[11px] opacity-90">{rec.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

