"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Trophy,
  Flame,
  Heart,
  TrendingUp,
  ExternalLink,
  Edit,
  Package,
} from "lucide-react";
import type { ProductLeaderboardDto } from "@himatu/shared";

interface ProductLeaderboardProps {
  data: ProductLeaderboardDto;
  currency?: string;
}

export function ProductLeaderboard({ data, currency = "৳" }: ProductLeaderboardProps) {
  const [activeTab, setActiveTab] = useState<"bestSelling" | "topRevenue" | "mostWishlisted">("bestSelling");

  const {
    bestSelling = [],
    topRevenue = [],
    mostWishlisted = [],
  } = data || {};

  const safeBestSelling = Array.isArray(bestSelling) ? bestSelling : [];
  const safeTopRevenue = Array.isArray(topRevenue) ? topRevenue : [];
  const safeMostWishlisted = Array.isArray(mostWishlisted) ? mostWishlisted : [];

  const currentList =
    activeTab === "bestSelling"
      ? safeBestSelling
      : activeTab === "topRevenue"
      ? safeTopRevenue
      : safeMostWishlisted;

  return (
    <div className="rounded-xl border border-neutral-200/80 bg-white p-6 shadow-sm space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-black uppercase tracking-tight text-neutral-900 flex items-center gap-2">
            <Trophy size={16} className="text-amber-500" />
            <span>Figurine Performance Leaderboard</span>
          </h2>
          <p className="text-xs text-neutral-500">
            Top-performing figures by volume, realized revenue, and collector wishlist demand.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="inline-flex rounded-lg border border-neutral-200 bg-neutral-50 p-0.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("bestSelling")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition ${
              activeTab === "bestSelling" ? "bg-neutral-900 text-white shadow-xs" : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            <Flame size={13} />
            <span>Best Sellers</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("topRevenue")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition ${
              activeTab === "topRevenue" ? "bg-neutral-900 text-white shadow-xs" : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            <TrendingUp size={13} />
            <span>Top Revenue</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("mostWishlisted")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition ${
              activeTab === "mostWishlisted" ? "bg-neutral-900 text-white shadow-xs" : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            <Heart size={13} />
            <span>Wishlist Demand</span>
          </button>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="overflow-x-auto">
        {currentList.length > 0 ? (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-100 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                <th className="pb-3 w-12 text-center">Rank</th>
                <th className="pb-3">Figurine</th>
                <th className="pb-3">Universe</th>
                <th className="pb-3 text-center">Stock</th>
                {activeTab === "mostWishlisted" ? (
                  <>
                    <th className="pb-3 text-center">Price</th>
                    <th className="pb-3 text-right">Wishlisted</th>
                  </>
                ) : (
                  <>
                    <th className="pb-3 text-center">Units Sold</th>
                    <th className="pb-3 text-right">Total Revenue</th>
                  </>
                )}
                <th className="pb-3 text-right">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {currentList.map((item: any, idx: number) => (
                <tr key={item.productId || idx} className="hover:bg-neutral-50/60 transition">
                  <td className="py-3 text-center">
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-black ${
                        idx === 0
                          ? "bg-amber-400 text-neutral-900"
                          : idx === 1
                          ? "bg-neutral-300 text-neutral-900"
                          : idx === 2
                          ? "bg-amber-700 text-white"
                          : "bg-neutral-100 text-neutral-600"
                      }`}
                    >
                      {item.rank || idx + 1}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-9 w-9 rounded-md object-cover border border-neutral-200"
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-md bg-neutral-100 flex items-center justify-center text-neutral-400 text-xs">
                          N/A
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-neutral-900 truncate max-w-[220px]" title={item.name}>
                          {item.name}
                        </p>
                        <p className="text-[10px] text-neutral-400 font-mono">{item.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-neutral-600 font-medium">{item.categoryName || "Anime"}</td>
                  <td className="py-3 text-center">
                    <span
                      className={`font-bold ${
                        item.remainingStock === 0
                          ? "text-rose-600"
                          : item.remainingStock <= 5
                          ? "text-amber-600"
                          : "text-neutral-900"
                      }`}
                    >
                      {item.remainingStock}
                    </span>
                  </td>

                  {activeTab === "mostWishlisted" ? (
                    <>
                      <td className="py-3 text-center text-neutral-900 font-bold">
                        {currency}{item.currentPrice?.toLocaleString()}
                      </td>
                      <td className="py-3 text-right font-black text-rose-600">
                        {item.wishlistCount} saves
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-3 text-center font-bold text-neutral-900">{item.unitsSold}</td>
                      <td className="py-3 text-right font-black text-neutral-900">
                        {currency}{item.revenue?.toLocaleString()}
                      </td>
                    </>
                  )}

                  <td className="py-3 text-right">
                    <Link
                      href={`/admin/products?search=${encodeURIComponent(item.sku || "")}`}
                      className="inline-flex items-center gap-1 rounded border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-neutral-700 hover:bg-neutral-50 shadow-xs"
                      title="Edit figurine in catalogue"
                    >
                      <Edit size={12} />
                      <span>Edit</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-12 text-center text-xs text-neutral-400">
            No sales or wishlist records found for this ranking criteria.
          </div>
        )}
      </div>
    </div>
  );
}

