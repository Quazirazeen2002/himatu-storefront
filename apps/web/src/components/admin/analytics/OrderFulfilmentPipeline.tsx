"use client";

import Link from "next/link";
import {
  Clock,
  CheckCircle,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
} from "lucide-react";
import type { OrderFulfilmentDto } from "@himatu/shared";

interface OrderFulfilmentPipelineProps {
  data: OrderFulfilmentDto;
}

export function OrderFulfilmentPipeline({ data }: OrderFulfilmentPipelineProps) {
  const {
    stages = [],
    cancellationRate = 0,
    awaitingConfirmationCount = 0,
    activeTransitCount = 0,
  } = data || {};

  const safeStages = Array.isArray(stages) ? stages : [];

  const stageIcons: Record<string, any> = {
    PENDING: Clock,
    CONFIRMED: CheckCircle,
    PROCESSING: Package,
    SHIPPED: Truck,
    DELIVERED: CheckCircle2,
    CANCELLED: XCircle,
  };

  const stageColors: Record<string, { bg: string; text: string; border: string }> = {
    PENDING: { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200" },
    CONFIRMED: { bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-200" },
    PROCESSING: { bg: "bg-purple-50", text: "text-purple-800", border: "border-purple-200" },
    SHIPPED: { bg: "bg-indigo-50", text: "text-indigo-800", border: "border-indigo-200" },
    DELIVERED: { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200" },
    CANCELLED: { bg: "bg-rose-50", text: "text-rose-800", border: "border-rose-200" },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-black uppercase tracking-tight text-neutral-900">
            Order Fulfilment Pipeline & Flow
          </h2>
          <p className="text-xs text-neutral-500">
            Click any lifecycle stage to drill down directly into the filtered Orders Control Center.
          </p>
        </div>

        {/* Quick Operational Pills */}
        <div className="flex items-center gap-3 text-xs">
          <div className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 shadow-xs flex items-center gap-2">
            <span className="text-neutral-500">Cancellation Rate:</span>
            <span className={`font-bold ${cancellationRate > 5 ? "text-rose-600" : "text-emerald-600"}`}>
              {cancellationRate}%
            </span>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 shadow-xs flex items-center gap-2">
            <span className="text-neutral-500">Active in Transit:</span>
            <span className="font-bold text-neutral-900">{activeTransitCount} orders</span>
          </div>
        </div>
      </div>

      {/* 1. Horizontal Status Pipeline Flow */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {safeStages.map((stage) => {
          const Icon = stageIcons[stage.status] || Package;
          const styling = stageColors[stage.status] || {
            bg: "bg-neutral-50",
            text: "text-neutral-800",
            border: "border-neutral-200",
          };

          return (
            <Link
              key={stage.status}
              href={`/admin/orders?status=${stage.status}`}
              className={`group relative rounded-xl border p-4 shadow-xs transition hover:shadow-md hover:-translate-y-0.5 ${styling.border} ${styling.bg}`}
              title={`View ${stage.label} orders`}
            >
              <div className="flex items-center justify-between">
                <Icon size={16} className={styling.text} />
                <span className="text-[10px] font-bold text-neutral-400 group-hover:text-neutral-900 transition flex items-center gap-0.5">
                  View <ArrowRight size={10} />
                </span>
              </div>

              <p className="mt-3 text-xl font-black text-neutral-900">{stage.count}</p>
              <p className="text-xs font-bold text-neutral-800 truncate mt-0.5">{stage.label}</p>
              <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-500 pt-2 border-t border-neutral-200/50">
                <span>{stage.percentage}% of total</span>
                {stage.changeFromPreviousPercent !== null ? (
                  <span
                    className={`inline-flex items-center font-bold ${
                      stage.changeFromPreviousPercent >= 0 ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {stage.changeFromPreviousPercent >= 0 ? "+" : ""}
                    {stage.changeFromPreviousPercent}%
                  </span>
                ) : (
                  <span>—</span>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* 2. Fulfilment Urgency Notice */}
      {awaitingConfirmationCount > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 p-2 text-amber-800">
              <ShieldAlert size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-950">
                {awaitingConfirmationCount} order(s) awaiting confirmation
              </p>
              <p className="text-[11px] text-amber-800">
                Review and approve pending orders to trigger inventory dispatch before daily courier pickup.
              </p>
            </div>
          </div>
          <Link
            href="/admin/orders?status=PENDING"
            className="rounded-lg bg-amber-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-amber-950 transition"
          >
            Review Orders
          </Link>
        </div>
      )}
    </div>
  );
}

