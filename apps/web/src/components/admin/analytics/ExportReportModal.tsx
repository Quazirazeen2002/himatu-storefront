"use client";

import { useState } from "react";
import { Download, FileText, CheckCircle2, X } from "lucide-react";
import type { AnalyticsOverviewDto } from "@himatu/shared";

interface ExportReportModalProps {
  data: AnalyticsOverviewDto;
  onClose: () => void;
}

export function ExportReportModal({ data, onClose }: ExportReportModalProps) {
  const [downloaded, setDownloaded] = useState<string | null>(null);

  const downloadCsv = (filename: string, csvContent: string) => {
    // Add UTF-8 BOM for Excel compatibility
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloaded(filename);
    setTimeout(() => setDownloaded(null), 3000);
  };

  const exportRevenue = () => {
    const rows = [
      ["Metric", "Value", "Currency"],
      ["Gross Order Value", data.revenue.grossOrderValue, "BDT"],
      ["Collected Revenue", data.revenue.collectedRevenue, "BDT"],
      ["Pending COD Amount", data.revenue.pendingCodRevenue, "BDT"],
      ["Average Order Value", data.revenue.averageOrderValue, "BDT"],
      ["Total Valid Orders", data.revenue.totalOrders, "Units"],
      ["Cancelled Orders", data.revenue.cancelledOrders, "Units"],
      [],
      ["Date", "Collected (BDT)", "Gross Value (BDT)", "Order Volume"],
      ...data.revenue.trendPoints.map((p) => [p.date, p.collected, p.gross, p.orders]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    downloadCsv(`himatu-revenue-report-${new Date().toISOString().split("T")[0]}.csv`, csv);
  };

  const exportCollections = () => {
    const rows = [
      ["Anime Universe", "Active Figures", "Units Sold", "Revenue (BDT)", "Revenue Share (%)"],
      ...data.collections.collections.map((c) => [
        `"${c.name}"`,
        c.activeProducts,
        c.unitsSold,
        c.revenue,
        `${c.sharePercentage}%`,
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    downloadCsv(`himatu-anime-collections-${new Date().toISOString().split("T")[0]}.csv`, csv);
  };

  const exportProducts = () => {
    const rows = [
      ["Rank", "Figurine Name", "SKU", "Anime Collection", "Units Sold", "Revenue (BDT)", "Available Stock"],
      ...data.products.bestSelling.map((p) => [
        p.rank,
        `"${p.name.replace(/"/g, '""')}"`,
        p.sku,
        `"${p.categoryName}"`,
        p.unitsSold,
        p.revenue,
        p.remainingStock,
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    downloadCsv(`himatu-product-leaderboard-${new Date().toISOString().split("T")[0]}.csv`, csv);
  };

  const exportInventory = () => {
    const rows = [
      ["Figurine Name", "SKU", "Anime Universe", "Available Stock", "Threshold", "Stock Status"],
      ...data.inventory.lowStockAlerts.map((i) => [
        `"${i.name.replace(/"/g, '""')}"`,
        i.sku,
        `"${i.categoryName}"`,
        i.availableStock,
        i.threshold,
        i.status,
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    downloadCsv(`himatu-inventory-health-${new Date().toISOString().split("T")[0]}.csv`, csv);
  };

  const exportCustomers = () => {
    const rows = [
      ["Bangladesh District", "Customer Count", "Order Volume", "Total Spend (BDT)", "Share (%)"],
      ...data.customers.districts.map((d) => [
        `"${d.district}"`,
        d.customerCount,
        d.orderCount,
        d.revenue,
        `${d.sharePercentage}%`,
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    downloadCsv(`himatu-customer-districts-${new Date().toISOString().split("T")[0]}.csv`, csv);
  };

  const reports = [
    {
      title: "Revenue & Cash Flow Ledger",
      desc: "Gross order values, settled cash, pending COD, and daily velocity.",
      action: exportRevenue,
    },
    {
      title: "Anime Collection Performance",
      desc: "Revenue, volume, and percentage contribution per anime universe.",
      action: exportCollections,
    },
    {
      title: "Product Leaderboard & Velocity",
      desc: "Best-selling figures ranked with realized order-item turnover.",
      action: exportProducts,
    },
    {
      title: "Inventory Health & Restock Alerts",
      desc: "Figurines at risk of depletion with physical counts and status.",
      action: exportInventory,
    },
    {
      title: "Geographic Delivery Distribution",
      desc: "Aggregated sales volume categorized by Bangladesh administrative districts.",
      action: exportCustomers,
    },
  ];

  return (
    <div className="admin-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="admin-modal-box" style={{ maxWidth: 540, background: "#ffffff", borderRadius: 12 }}>
        <div className="admin-modal-header">
          <div className="flex items-center gap-2">
            <Download size={18} className="text-neutral-900" />
            <h3 className="text-base font-bold text-neutral-900">Export Business Reports (CSV)</h3>
          </div>
          <button type="button" onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
            <X size={18} />
          </button>
        </div>

        <div className="admin-modal-body">
          <p className="text-xs text-neutral-500">
            Export structured tabular datasets formatted in BDT currency for spreadsheet analysis or accounting.
          </p>

          <div className="space-y-3">
            {reports.map((rep, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-xl border border-neutral-200/80 p-3.5 hover:bg-neutral-50 transition"
              >
                <div>
                  <h4 className="text-xs font-bold text-neutral-900">{rep.title}</h4>
                  <p className="text-[11px] text-neutral-500">{rep.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={rep.action}
                  className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-800 shadow-xs hover:bg-neutral-100 transition active:scale-95"
                >
                  Download CSV
                </button>
              </div>
            ))}
          </div>

          {downloaded && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 size={14} />
              <span>Downloaded: {downloaded}</span>
            </div>
          )}
        </div>

        <div className="admin-modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold text-white hover:bg-black"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

