"use client";

import {
  Eye,
  ShoppingBag,
  CreditCard,
  CheckCircle2,
  Users,
  AlertCircle,
  TrendingDown,
  Info,
} from "lucide-react";
import type { ConversionFunnelDto } from "@himatu/shared";

interface ConversionFunnelProps {
  data: ConversionFunnelDto;
}

export function ConversionFunnel({ data }: ConversionFunnelProps) {
  const {
    trackingActivatedAt = "2026-01-01T00:00:00.000Z",
    totalSessions = 0,
    productViews = 0,
    addToCartEvents = 0,
    checkoutStartedEvents = 0,
    purchaseCompletedEvents = 0,
    stages = [],
    isHistoricalUnavailable = false,
  } = data || {};

  const safeStages = Array.isArray(stages) ? stages : [];

  const stageIcons = [Users, Eye, ShoppingBag, CreditCard, CheckCircle2];

  return (
    <div className="rounded-xl border border-neutral-200/80 bg-white p-6 shadow-sm space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-black uppercase tracking-tight text-neutral-900">
            Storefront Conversion Funnel
          </h2>
          <p className="text-xs text-neutral-500">
            End-to-end shopping progression from storefront landing to authoritative order placement.
          </p>
        </div>

        {/* Telemetry Activation Badge */}
        <div className="flex items-center gap-2 rounded-lg bg-neutral-100 px-3 py-1.5 text-xs text-neutral-600">
          <Info size={13} className="text-neutral-500" />
          <span>
            Telemetry Active Since:{" "}
            <strong className="text-neutral-900">
              {new Date(trackingActivatedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </strong>
          </span>
        </div>
      </div>

      {isHistoricalUnavailable && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 flex items-center gap-2">
          <AlertCircle size={15} />
          <span>
            Selected reporting period precedes telemetry activation. Telemetry records began on{" "}
            {new Date(trackingActivatedAt).toLocaleDateString()}.
          </span>
        </div>
      )}

      {/* 1. Step-down Funnel Graphic */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        {safeStages.map((stg, idx) => {
          const Icon = stageIcons[idx] || Users;
          return (
            <div key={stg.stageName} className="analytics-funnel-step">
              <div className="flex items-center justify-between text-neutral-400 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider">Stage {idx + 1}</span>
                <Icon size={14} className="text-neutral-700" />
              </div>

              <p className="text-xs font-bold text-neutral-900">{stg.stageName}</p>
              <p className="mt-2 text-2xl font-black text-neutral-900">{stg.eventCount.toLocaleString()}</p>

              {/* Progress track */}
              <div className="mt-3 h-2 w-full rounded-full bg-neutral-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-neutral-900 transition-all duration-500"
                  style={{ width: `${Math.max(stg.overallConversionRate, 4)}%` }}
                />
              </div>

              <div className="mt-3 pt-2 border-t border-neutral-200/60 flex items-center justify-between text-[11px]">
                <span className="text-neutral-500 font-medium">Step Conversion:</span>
                <span className="font-bold text-neutral-900">{stg.stepConversionRate}%</span>
              </div>

              {idx > 0 && stg.dropOffRate > 0 && (
                <div className="mt-1 flex items-center justify-between text-[11px] text-rose-600 font-medium">
                  <span className="flex items-center gap-0.5">
                    <TrendingDown size={11} /> Drop-off:
                  </span>
                  <span>{stg.dropOffRate}%</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 2. Analytical Integrity Note */}
      <div className="rounded-lg bg-neutral-50 p-3.5 text-xs text-neutral-600 border border-neutral-200/60 flex items-center justify-between">
        <div>
          <strong className="text-neutral-900">Authoritative Financial Reconciliation:</strong> Stage 5 completed purchases are reconciled against verified PostgreSQL order records. No synthetic visitor or conversion numbers are fabricated.
        </div>
        <span className="text-[11px] font-mono text-neutral-400">First-Party Telemetry</span>
      </div>
    </div>
  );
}

