"use client";

import { useState } from "react";
import {
  Calendar,
  RotateCw,
  Download,
  Printer,
  ChevronDown,
  Filter,
  Layers,
} from "lucide-react";
import type { AnalyticsFilterParams, AnalyticsPeriod } from "@himatu/shared";

interface AnalyticsHeaderProps {
  filters: AnalyticsFilterParams;
  onChange: (updated: Partial<AnalyticsFilterParams>) => void;
  onRefresh: () => void;
  onExport: () => void;
  isLoading: boolean;
}

const PERIOD_OPTIONS: Array<{ label: string; value: AnalyticsPeriod }> = [
  { label: "Today", value: "today" },
  { label: "Last 7 Days", value: "last_7_days" },
  { label: "Last 30 Days", value: "last_30_days" },
  { label: "Last 90 Days", value: "last_90_days" },
  { label: "This Month", value: "this_month" },
  { label: "Previous Month", value: "prev_month" },
  { label: "This Year", value: "this_year" },
  { label: "Custom", value: "custom" },
];

export function AnalyticsHeader({
  filters,
  onChange,
  onRefresh,
  onExport,
  isLoading,
}: AnalyticsHeaderProps) {
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const currentPeriod = filters.period || "last_30_days";

  const handleApplyCustom = () => {
    if (customStart && customEnd) {
      onChange({
        period: "custom",
        startDate: new Date(customStart).toISOString(),
        endDate: new Date(customEnd).toISOString(),
      });
      setShowCustomModal(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Page Title & Action Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black uppercase tracking-tight text-neutral-900">
              Business Intelligence & Analytics
            </h1>
            <span className="rounded bg-black px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
              Executive
            </span>
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            Real-time financial performance, inventory velocity, anime collection analytics, and AI recommendations for HIMATU.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 shadow-sm transition hover:bg-neutral-50 active:scale-95 disabled:opacity-50"
            title="Refresh analytics data"
          >
            <RotateCw size={14} className={isLoading ? "animate-spin text-neutral-400" : ""} />
            <span>{isLoading ? "Refreshing…" : "Refresh"}</span>
          </button>

          <button
            type="button"
            onClick={onExport}
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 shadow-sm transition hover:bg-neutral-50 active:scale-95"
            title="Export CSV Reports"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-black active:scale-95"
            title="Print Executive Intelligence Report"
          >
            <Printer size={14} />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* 2. Global Analytics Toolbar */}
      <div className="analytics-toolbar">
        <div className="analytics-filter-pills">
          {PERIOD_OPTIONS.map((opt) => {
            const isActive = currentPeriod === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                className={`analytics-pill-btn ${isActive ? "is-active" : ""}`}
                onClick={() => {
                  if (opt.value === "custom") {
                    setShowCustomModal(true);
                  } else {
                    onChange({ period: opt.value, startDate: undefined, endDate: undefined });
                  }
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Compare toggle */}
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-neutral-600">
            <input
              type="checkbox"
              checked={filters.compare !== false}
              onChange={(e) => onChange({ compare: e.target.checked })}
              className="rounded border-neutral-300 text-neutral-900 focus:ring-black"
            />
            <span>Compare vs previous period</span>
          </label>

          {/* Timezone Indicator */}
          <div className="flex items-center gap-1 rounded bg-neutral-100 px-2 py-1 text-[11px] font-semibold text-neutral-600">
            <Calendar size={12} />
            <span>BST (Asia/Dhaka)</span>
          </div>
        </div>
      </div>

      {/* 3. Custom Date Range Modal */}
      {showCustomModal && (
        <div className="admin-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setShowCustomModal(false); }}>
          <div className="admin-modal-box" style={{ maxWidth: 420, background: "#ffffff", borderRadius: 12 }}>
            <div className="admin-modal-header">
              <h3 className="text-base font-bold text-neutral-900">Custom Reporting Range</h3>
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                ✕
              </button>
            </div>
            <div className="admin-modal-body">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700">Start Date (Dhaka Time)</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700">End Date (Dhaka Time)</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                />
              </div>
            </div>
            <div className="admin-modal-footer">
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyCustom}
                disabled={!customStart || !customEnd}
                className="rounded-lg bg-black px-4 py-1.5 text-xs font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
              >
                Apply Range
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

