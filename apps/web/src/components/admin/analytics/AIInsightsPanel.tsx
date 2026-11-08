"use client";

import Link from "next/link";
import {
  Sparkles,
  AlertTriangle,
  TrendingUp,
  Lightbulb,
  CheckCircle2,
  ArrowRight,
  RotateCw,
  Cpu,
  Layers,
} from "lucide-react";
import type { BusinessInsightDto } from "@himatu/shared";

interface AIInsightsPanelProps {
  insights: BusinessInsightDto[];
  onRegenerate: () => void;
  isGenerating: boolean;
}

export function AIInsightsPanel({ insights, onRegenerate, isGenerating }: AIInsightsPanelProps) {
  const isRuleBased = insights.some((i) => i.source === "rule-based");

  const categoryIcons: Record<string, any> = {
    warning: AlertTriangle,
    opportunity: Lightbulb,
    performance: TrendingUp,
    recommendation: CheckCircle2,
  };

  const categoryBadges: Record<string, { bg: string; text: string; label: string }> = {
    warning: { bg: "bg-amber-100", text: "text-amber-800", label: "Warning Alert" },
    opportunity: { bg: "bg-blue-100", text: "text-blue-800", label: "Growth Opportunity" },
    performance: { bg: "bg-emerald-100", text: "text-emerald-800", label: "Performance Highlight" },
    recommendation: { bg: "bg-purple-100", text: "text-purple-800", label: "Operational Action" },
  };

  return (
    <div className="rounded-xl border border-neutral-200/80 bg-white p-6 shadow-sm space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white shadow-sm">
            <Sparkles size={18} className="text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black uppercase tracking-tight text-neutral-900">
                AI Business Insights Engine
              </h2>
              <span
                className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  isRuleBased
                    ? "bg-neutral-100 text-neutral-700 border border-neutral-200"
                    : "bg-purple-100 text-purple-800 border border-purple-200"
                }`}
              >
                {isRuleBased ? "Rule-Based Deterministic Engine" : "Gemini Applied AI"}
              </span>
            </div>
            <p className="text-xs text-neutral-500">
              Grounded operational recommendations synthesized directly from authentic commerce telemetry.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onRegenerate}
          disabled={isGenerating}
          className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-800 shadow-xs hover:bg-neutral-50 active:scale-95 disabled:opacity-50"
        >
          <RotateCw size={13} className={isGenerating ? "animate-spin text-neutral-400" : ""} />
          <span>{isGenerating ? "Analyzing Metrics…" : "Regenerate Insights"}</span>
        </button>
      </div>

      {/* Insight Cards Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {insights.map((insight) => {
          const Icon = categoryIcons[insight.category] || Lightbulb;
          const badge = categoryBadges[insight.category] || {
            bg: "bg-neutral-100",
            text: "text-neutral-800",
            label: "Insight",
          };

          return (
            <div
              key={insight.id}
              className={`analytics-insight-card ${insight.category}`}
            >
              <div className="flex items-center justify-between">
                <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${badge.bg} ${badge.text}`}>
                  {badge.label}
                </span>
                <span className="text-[10px] font-mono text-neutral-400">
                  {insight.confidence.toUpperCase()} CONFIDENCE
                </span>
              </div>

              <h3 className="text-sm font-bold text-neutral-900 mt-1">{insight.title}</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">{insight.summary}</p>

              {/* Source Evidence Snapshot */}
              <div className="rounded-md bg-neutral-50 p-2 text-[11px] border border-neutral-100 text-neutral-700">
                <span className="font-semibold text-neutral-900">Source Evidence: </span>
                <span className="font-mono">{insight.evidence.metric}</span> ={" "}
                <strong className="text-neutral-900">{insight.evidence.value}</strong>{" "}
                {insight.evidence.context && `(${insight.evidence.context})`}
              </div>

              {/* Action Button */}
              <div className="mt-2 pt-2 border-t border-neutral-100 flex items-center justify-between">
                <span className="text-[11px] font-medium text-neutral-500">
                  {insight.recommendedAction}
                </span>
                <Link
                  href={insight.destination}
                  className="inline-flex items-center gap-1 rounded bg-neutral-900 px-2.5 py-1 text-xs font-semibold text-white shadow-xs hover:bg-black transition"
                >
                  <span>Resolve</span>
                  <ArrowRight size={11} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Safety & Grounding Guarantee */}
      <div className="rounded-lg bg-neutral-50 p-3 text-xs text-neutral-500 border border-neutral-200/50 flex items-center gap-2">
        <Cpu size={14} className="text-neutral-400 shrink-0" />
        <span>
          <strong>Grounding Guarantee:</strong> All insight statements are evaluated strictly against verified database tallies. The engine does not have authority to alter prices, modify stock, or execute transactions.
        </span>
      </div>
    </div>
  );
}

