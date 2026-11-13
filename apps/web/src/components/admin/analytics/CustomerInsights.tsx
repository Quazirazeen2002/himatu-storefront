"use client";

import Link from "next/link";
import {
  Users,
  UserPlus,
  UserCheck,
  MapPin,
  Clock,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import type { CustomerInsightsDto } from "@himatu/shared";

interface CustomerInsightsProps {
  data: CustomerInsightsDto;
  currency?: string;
}

export function CustomerInsights({ data, currency = "৳" }: CustomerInsightsProps) {
  const {
    totalRegistered = 0,
    newCustomersInPeriod = 0,
    returningCustomersInPeriod = 0,
    purchasingCustomersCount = 0,
    repeatPurchaseRate = 0,
    ordersPerCustomerAvg = 0,
    districts = [],
    recentActivity = [],
  } = data || {};

  const safeDistricts = Array.isArray(districts) ? districts : [];
  const safeRecentActivity = Array.isArray(recentActivity) ? recentActivity : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-black uppercase tracking-tight text-neutral-900">
          Collector & Customer Intelligence
        </h2>
        <p className="text-xs text-neutral-500">
          Acquisition curves, repeat purchase fidelity, and geographic delivery concentration across Bangladesh.
        </p>
      </div>

      {/* 1. Six Customer KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Registered</span>
            <Users size={14} />
          </div>
          <p className="mt-2 text-2xl font-black text-neutral-900">{totalRegistered}</p>
          <p className="mt-1 text-xs text-neutral-500">Verified collector accounts</p>
        </div>

        <div className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">New In Period</span>
            <UserPlus size={14} />
          </div>
          <p className="mt-2 text-2xl font-black text-neutral-900">{newCustomersInPeriod}</p>
          <p className="mt-1 text-xs text-emerald-600 font-semibold">New acquisitions</p>
        </div>

        <div className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Returning Buyers</span>
            <UserCheck size={14} />
          </div>
          <p className="mt-2 text-2xl font-black text-neutral-900">{returningCustomersInPeriod}</p>
          <p className="mt-1 text-xs text-neutral-500">Active repeat shoppers</p>
        </div>

        <div className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Paying Customers</span>
            <Users size={14} />
          </div>
          <p className="mt-2 text-2xl font-black text-neutral-900">{purchasingCustomersCount}</p>
          <p className="mt-1 text-xs text-neutral-500">Placed at least 1 order</p>
        </div>

        <div className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Repeat Rate</span>
            <TrendingUp size={14} />
          </div>
          <p className="mt-2 text-2xl font-black text-neutral-900">{repeatPurchaseRate}%</p>
          <p className="mt-1 text-xs text-neutral-500">&gt; 1 order completed</p>
        </div>

        <div className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Orders / Buyer</span>
            <Users size={14} />
          </div>
          <p className="mt-2 text-2xl font-black text-neutral-900">{ordersPerCustomerAvg}</p>
          <p className="mt-1 text-xs text-neutral-500">Average buyer frequency</p>
        </div>
      </div>

      {/* 2. District Distribution & Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Geographic District Distribution */}
        <div className="rounded-xl border border-neutral-200/80 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-1.5">
                <MapPin size={14} className="text-emerald-700" />
                <span>Geographic Sales Distribution (Bangladesh Districts)</span>
              </h3>
              <p className="text-[11px] text-neutral-500">
                Aggregated delivery volume by administrative district (privacy protected, zero PII)
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {safeDistricts.length > 0 ? (
              safeDistricts.map((d) => (
                <div key={d.district} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-neutral-800">{d.district}</span>
                    <span className="font-semibold text-neutral-900">
                      {currency}{d.revenue.toLocaleString()} ({d.sharePercentage}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-neutral-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-neutral-900 transition-all duration-500"
                      style={{ width: `${Math.max(d.sharePercentage, 3)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-neutral-400">
                    <span>{d.customerCount} unique collector(s)</span>
                    <span>{d.orderCount} delivery parcel(s)</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-neutral-400">
                No delivery addresses recorded in selected period.
              </div>
            )}
          </div>
        </div>

        {/* Recent Customer Activity */}
        <div className="rounded-xl border border-neutral-200/80 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1">
                <Clock size={13} />
                <span>Collector Feed</span>
              </h3>
              <Link
                href="/admin/customers"
                className="text-[11px] font-semibold text-neutral-900 hover:underline flex items-center gap-0.5"
              >
                Directory <ArrowRight size={10} />
              </Link>
            </div>

            <div className="space-y-3">
              {safeRecentActivity.length > 0 ? (
                safeRecentActivity.slice(0, 5).map((act) => (
                  <div
                    key={act.id}
                    className="rounded-lg border border-neutral-100 p-2.5 text-xs transition hover:bg-neutral-50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-neutral-900">{act.customerName}</span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-neutral-600">{act.detail}</p>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-neutral-400">
                  No recent customer activity.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-100 text-[11px] text-neutral-500">
            <span>Customer privacy policy enforced. Exact phone and address strings are sequestered.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

