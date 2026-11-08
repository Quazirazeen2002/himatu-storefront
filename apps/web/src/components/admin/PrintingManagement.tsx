"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Printer,
  Sparkles,
  Layers,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Search,
  Eye,
  Plus,
  X,
  FileText,
  DollarSign,
  Calendar,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { authService, CustomerSession } from "@/lib/auth-service";
import {
  getAdminPrintingRequests,
  updateAdminPrintingStatus,
  createAdminPrintingQuotation,
} from "@/lib/commerce-api";
import type { PrintingRequestDto, CreateQuotationDto } from "@himatu/shared";

export function PrintingManagement() {
  const [session, setSession] = useState<CustomerSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<PrintingRequestDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [selectedReq, setSelectedReq] = useState<PrintingRequestDto | null>(null);
  const [quoteReq, setQuoteReq] = useState<PrintingRequestDto | null>(null);

  // Quotation Builder Form State
  const [quoteForm, setQuoteForm] = useState<CreateQuotationDto>({
    baseCost: 5000,
    materialCost: 4000,
    printingCost: 5000,
    finishingCost: 3000,
    paintingCost: 6000,
    customizationCost: 0,
    shippingCost: 500,
    discountAmount: 0,
    depositPercent: 50,
    productionDays: 14,
    validityDays: 14,
    termsAndNotes: "Standard 50% commitment deposit required before 3D sculpting and resin vat printing commences.",
  });

  const [statusNote, setStatusNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadData = async (token: string) => {
    try {
      const data = await getAdminPrintingRequests(token, {
        page,
        limit: 20,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        search: searchQuery || undefined,
      });
      setRequests(data.items);
      setTotal(data.total);
    } catch (err: any) {
      console.error(err);
      setFeedback({ type: "error", text: err.message || "Failed to load printing requests." });
    }
  };

  useEffect(() => {
    authService.getSession().then((s) => {
      setSession(s);
      if (s?.accessToken && s.user.role === "ADMIN") {
        loadData(s.accessToken).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });
  }, [page, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (session?.accessToken) {
      setPage(1);
      loadData(session.accessToken);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!session?.accessToken || !selectedReq) return;
    setActionLoading(true);
    try {
      const updated = await updateAdminPrintingStatus(
        session.accessToken,
        selectedReq.id,
        newStatus,
        statusNote || selectedReq.internalNotes || undefined,
      );
      setSelectedReq(updated);
      setFeedback({ type: "success", text: `Status updated to ${newStatus}.` });
      await loadData(session.accessToken);
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Status update failed." });
    } finally {
      setActionLoading(false);
    }
  };

  // Live Quotation Calculations
  const calcSubtotal =
    (quoteForm.baseCost || 0) +
    (quoteForm.materialCost || 0) +
    (quoteForm.printingCost || 0) +
    (quoteForm.finishingCost || 0) +
    (quoteForm.paintingCost || 0) +
    (quoteForm.customizationCost || 0) +
    (quoteForm.shippingCost || 0);

  const calcTotal = Math.max(0, calcSubtotal - (quoteForm.discountAmount || 0));
  const calcDeposit = Math.round((calcTotal * (quoteForm.depositPercent || 50)) / 100);

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.accessToken || !quoteReq) return;
    setActionLoading(true);

    try {
      await createAdminPrintingQuotation(session.accessToken, quoteReq.id, quoteForm);
      setFeedback({
        type: "success",
        text: `Quotation generated and sent to customer (${formatBDT(calcTotal)} with ${formatBDT(calcDeposit)} deposit).`,
      });
      setQuoteReq(null);
      await loadData(session.accessToken);
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed to generate quotation." });
    } finally {
      setActionLoading(false);
    }
  };

  const formatBDT = (amount: number) =>
    `৳${new Intl.NumberFormat("en-BD").format(amount)}`;

  return (
    <div>
      <div className="admin-page-header">
        <div className="admin-page-title-group">
          <h1>Custom 3D Printing & Fabrication Workbench</h1>
          <p>Customer STL & concept inquiries, itemized quotation engine, and production Kanban.</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <Link
            href="/admin/3d-printing/production"
            className="admin-btn admin-btn-primary"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <Layers size={14} /> Production Kanban Board
          </Link>
        </div>
      </div>

      {feedback && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "6px",
            marginBottom: "20px",
            fontSize: "13px",
            fontWeight: 600,
            background: feedback.type === "success" ? "#ecfdf5" : "#fef2f2",
            color: feedback.type === "success" ? "#065f46" : "#991b1b",
            border: `1px solid ${feedback.type === "success" ? "#a7f3d0" : "#fecaca"}`,
          }}
        >
          {feedback.text}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="admin-card" style={{ marginBottom: "20px", padding: "16px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          {/* Status Tabs */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {["ALL", "SUBMITTED", "UNDER_REVIEW", "QUOTED", "IN_PRODUCTION", "COMPLETED"].map((st) => (
              <button
                key={st}
                type="button"
                className={`admin-btn ${statusFilter === st ? "admin-btn-primary" : "admin-btn-secondary"}`}
                style={{ fontSize: "12px", padding: "6px 12px" }}
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
              >
                {st.replace(/_/g, " ")}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <form onSubmit={handleSearch} style={{ display: "flex", gap: "8px" }}>
            <div style={{ position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: "10px", top: "10px", color: "var(--admin-muted)" }} />
              <input
                type="text"
                placeholder="Search character, req#, customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: "7px 12px 7px 30px",
                  fontSize: "12px",
                  border: "1px solid var(--admin-border)",
                  borderRadius: "4px",
                  width: "240px",
                }}
              />
            </div>
            <button type="submit" className="admin-btn admin-btn-secondary" style={{ fontSize: "12px" }}>
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Requests Data Table */}
      <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Request #</th>
              <th>Character & Franchise</th>
              <th>Customer</th>
              <th>Scale & Material</th>
              <th>Finish Level</th>
              <th>Status</th>
              <th>Quotation</th>
              <th>Date</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", padding: "40px" }}>
                  Loading 3D printing requests…
                </td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", padding: "40px", color: "var(--admin-muted)" }}>
                  No 3D printing requests found matching this view.
                </td>
              </tr>
            ) : (
              requests.map((req) => {
                const activeQuote = req.activeQuotation || req.quotations?.[0];

                return (
                  <tr key={req.id}>
                    <td>
                      <code style={{ fontSize: "12px", fontWeight: 800 }}>{req.requestNumber}</code>
                    </td>
                    <td>
                      <strong style={{ fontSize: "13px", display: "block" }}>{req.characterName}</strong>
                      <span style={{ fontSize: "11px", color: "var(--admin-muted)" }}>{req.animeName}</span>
                    </td>
                    <td>
                      <div style={{ fontSize: "12px", fontWeight: 600 }}>{req.customerName}</div>
                      <div style={{ fontSize: "11px", color: "var(--admin-muted)" }}>{req.customerPhone}</div>
                    </td>
                    <td style={{ fontSize: "12px" }}>
                      <div>{req.sizePreference || "Standard"}</div>
                      <span style={{ fontSize: "11px", color: "var(--admin-muted)" }}>
                        {req.materialPreference || "8K Resin"}
                      </span>
                    </td>
                    <td style={{ fontSize: "12px" }}>
                      {req.finishPreference || "Hand-Painted"}
                    </td>
                    <td>
                      <span
                        className={`admin-status-badge ${
                          req.status === "COMPLETED"
                            ? "status-paid"
                            : req.status === "QUOTED"
                              ? "status-pending"
                              : req.status === "IN_PRODUCTION"
                                ? "status-fulfilled"
                                : "status-unfulfilled"
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td>
                      {activeQuote ? (
                        <div>
                          <strong style={{ fontSize: "12px" }}>{formatBDT(activeQuote.totalAmount)}</strong>
                          <div style={{ fontSize: "10px", color: "var(--admin-muted)" }}>
                            {activeQuote.status}
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: "11px", color: "var(--admin-muted)" }}>Unquoted</span>
                      )}
                    </td>
                    <td style={{ fontSize: "12px", color: "var(--admin-muted)" }}>
                      {new Date(req.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        <button
                          type="button"
                          className="admin-btn admin-btn-secondary"
                          style={{ padding: "4px 8px", fontSize: "11px" }}
                          title="Generate or Revise Quotation"
                          onClick={() => {
                            setQuoteReq(req);
                            if (req.budgetEstimate) {
                              setQuoteForm((prev) => ({
                                ...prev,
                                baseCost: Math.round(req.budgetEstimate! * 0.25),
                                paintingCost: Math.round(req.budgetEstimate! * 0.35),
                              }));
                            }
                          }}
                        >
                          <DollarSign size={12} /> Quote
                        </button>

                        <button
                          type="button"
                          className="admin-btn admin-btn-secondary"
                          style={{ padding: "4px 8px", fontSize: "11px" }}
                          title="View Request Dossier"
                          onClick={() => setSelectedReq(req)}
                        >
                          <Eye size={12} /> Dossier
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Quotation Builder Modal */}
      {quoteReq && (
        <div className="admin-modal-backdrop" onClick={() => setQuoteReq(null)}>
          <div
            className="admin-modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "680px", maxHeight: "90vh", overflowY: "auto" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: 800, margin: 0 }}>
                  Build Commercial Quotation
                </h2>
                <p style={{ fontSize: "12px", color: "var(--admin-muted)", margin: "2px 0 0" }}>
                  {quoteReq.requestNumber} · {quoteReq.characterName} ({quoteReq.animeName})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQuoteReq(null)}
                style={{ background: "transparent", border: "none", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateQuotation}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", marginBottom: "16px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, display: "block", marginBottom: "2px" }}>
                    1. 3D Sculpting & Modeling (BDT)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={quoteForm.baseCost}
                    onChange={(e) => setQuoteForm({ ...quoteForm, baseCost: parseInt(e.target.value, 10) || 0 })}
                    style={{ width: "100%", padding: "6px 10px", fontSize: "13px", border: "1px solid var(--admin-border)", borderRadius: "4px" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, display: "block", marginBottom: "2px" }}>
                    2. 8K Photopolymer Resin Material (BDT)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={quoteForm.materialCost}
                    onChange={(e) => setQuoteForm({ ...quoteForm, materialCost: parseInt(e.target.value, 10) || 0 })}
                    style={{ width: "100%", padding: "6px 10px", fontSize: "13px", border: "1px solid var(--admin-border)", borderRadius: "4px" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, display: "block", marginBottom: "2px" }}>
                    3. SLA Machine Print Time & Slicing (BDT)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={quoteForm.printingCost}
                    onChange={(e) => setQuoteForm({ ...quoteForm, printingCost: parseInt(e.target.value, 10) || 0 })}
                    style={{ width: "100%", padding: "6px 10px", fontSize: "13px", border: "1px solid var(--admin-border)", borderRadius: "4px" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, display: "block", marginBottom: "2px" }}>
                    4. Post-Cure, Sanding & Support Polish (BDT)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={quoteForm.finishingCost}
                    onChange={(e) => setQuoteForm({ ...quoteForm, finishingCost: parseInt(e.target.value, 10) || 0 })}
                    style={{ width: "100%", padding: "6px 10px", fontSize: "13px", border: "1px solid var(--admin-border)", borderRadius: "4px" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, display: "block", marginBottom: "2px" }}>
                    5. Hand-Painting & Airbrush Gradients (BDT)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={quoteForm.paintingCost}
                    onChange={(e) => setQuoteForm({ ...quoteForm, paintingCost: parseInt(e.target.value, 10) || 0 })}
                    style={{ width: "100%", padding: "6px 10px", fontSize: "13px", border: "1px solid var(--admin-border)", borderRadius: "4px" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, display: "block", marginBottom: "2px" }}>
                    6. Custom Diorama Base / FX (BDT)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={quoteForm.customizationCost}
                    onChange={(e) => setQuoteForm({ ...quoteForm, customizationCost: parseInt(e.target.value, 10) || 0 })}
                    style={{ width: "100%", padding: "6px 10px", fontSize: "13px", border: "1px solid var(--admin-border)", borderRadius: "4px" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, display: "block", marginBottom: "2px" }}>
                    7. Insured Packaging & Shipping (BDT)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={quoteForm.shippingCost}
                    onChange={(e) => setQuoteForm({ ...quoteForm, shippingCost: parseInt(e.target.value, 10) || 0 })}
                    style={{ width: "100%", padding: "6px 10px", fontSize: "13px", border: "1px solid var(--admin-border)", borderRadius: "4px" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, display: "block", marginBottom: "2px" }}>
                    Discount Deduction (BDT)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={quoteForm.discountAmount}
                    onChange={(e) => setQuoteForm({ ...quoteForm, discountAmount: parseInt(e.target.value, 10) || 0 })}
                    style={{ width: "100%", padding: "6px 10px", fontSize: "13px", border: "1px solid var(--admin-border)", borderRadius: "4px" }}
                  />
                </div>
              </div>

              {/* Deposit and Timeline Settings */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "16px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, display: "block", marginBottom: "2px" }}>
                    Deposit Required (%)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={100}
                    value={quoteForm.depositPercent}
                    onChange={(e) => setQuoteForm({ ...quoteForm, depositPercent: parseInt(e.target.value, 10) || 50 })}
                    style={{ width: "100%", padding: "6px 10px", fontSize: "13px", border: "1px solid var(--admin-border)", borderRadius: "4px" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, display: "block", marginBottom: "2px" }}>
                    Production Days
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={quoteForm.productionDays}
                    onChange={(e) => setQuoteForm({ ...quoteForm, productionDays: parseInt(e.target.value, 10) || 14 })}
                    style={{ width: "100%", padding: "6px 10px", fontSize: "13px", border: "1px solid var(--admin-border)", borderRadius: "4px" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, display: "block", marginBottom: "2px" }}>
                    Quote Validity (Days)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={quoteForm.validityDays}
                    onChange={(e) => setQuoteForm({ ...quoteForm, validityDays: parseInt(e.target.value, 10) || 14 })}
                    style={{ width: "100%", padding: "6px 10px", fontSize: "13px", border: "1px solid var(--admin-border)", borderRadius: "4px" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "11px", fontWeight: 700, display: "block", marginBottom: "2px" }}>
                  Terms & Artisan Production Notes
                </label>
                <textarea
                  rows={2}
                  value={quoteForm.termsAndNotes}
                  onChange={(e) => setQuoteForm({ ...quoteForm, termsAndNotes: e.target.value })}
                  style={{ width: "100%", padding: "6px 10px", fontSize: "12px", border: "1px solid var(--admin-border)", borderRadius: "4px" }}
                />
              </div>

              {/* Real-time Calculation Summary Card */}
              <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "14px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "12px", color: "var(--admin-muted)" }}>Total Figure Price</div>
                  <div style={{ fontSize: "20px", fontWeight: 900 }}>{formatBDT(calcTotal)}</div>
                </div>
                <div>
                  <div style={{ fontSize: "12px", color: "var(--admin-muted)" }}>{quoteForm.depositPercent}% Deposit Due Now</div>
                  <div style={{ fontSize: "20px", fontWeight: 900, color: "#2563eb" }}>{formatBDT(calcDeposit)}</div>
                </div>
                <div>
                  <div style={{ fontSize: "12px", color: "var(--admin-muted)" }}>Remaining Upon Delivery</div>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: "#64748b" }}>{formatBDT(calcTotal - calcDeposit)}</div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={() => setQuoteReq(null)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  disabled={actionLoading || calcTotal <= 0}
                >
                  {actionLoading ? "Submitting Quotation…" : `Transmit Official Quotation (${formatBDT(calcTotal)})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request Dossier Modal / Drawer */}
      {selectedReq && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedReq(null)}>
          <div
            className="admin-modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "720px", maxHeight: "90vh", overflowY: "auto" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: 800, margin: 0 }}>
                  Commission Dossier: {selectedReq.requestNumber}
                </h2>
                <span style={{ fontSize: "12px", color: "var(--admin-muted)" }}>
                  Submitted on {new Date(selectedReq.createdAt).toLocaleString()}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReq(null)}
                style={{ background: "transparent", border: "none", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Actions Strip */}
            <div style={{ display: "flex", gap: "8px", alignItems: "center", padding: "10px", background: "#f8fafc", borderRadius: "4px", marginBottom: "16px", fontSize: "12px" }}>
              <span style={{ fontWeight: 700 }}>Quick Status Transition:</span>
              {["UNDER_REVIEW", "IN_PRODUCTION", "COMPLETED", "CANCELLED"].map((st) => (
                <button
                  key={st}
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  style={{ padding: "4px 8px", fontSize: "11px" }}
                  onClick={() => handleStatusChange(st)}
                  disabled={actionLoading}
                >
                  {st.replace(/_/g, " ")}
                </button>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", fontSize: "13px", marginBottom: "16px" }}>
              <div>
                <span style={{ color: "var(--admin-muted)", display: "block" }}>Character & Anime</span>
                <strong>{selectedReq.characterName} ({selectedReq.animeName})</strong>
              </div>
              <div>
                <span style={{ color: "var(--admin-muted)", display: "block" }}>Customer</span>
                <strong>{selectedReq.customerName}</strong>
                <div style={{ fontSize: "11px" }}>{selectedReq.customerEmail} · {selectedReq.customerPhone}</div>
              </div>
              <div>
                <span style={{ color: "var(--admin-muted)", display: "block" }}>Scale & Material</span>
                <strong>{selectedReq.sizePreference} · {selectedReq.materialPreference}</strong>
              </div>
              <div>
                <span style={{ color: "var(--admin-muted)", display: "block" }}>Artistic Finish</span>
                <strong>{selectedReq.finishPreference}</strong>
              </div>
            </div>

            {selectedReq.description && (
              <div style={{ marginBottom: "16px" }}>
                <span style={{ color: "var(--admin-muted)", fontSize: "11px", display: "block", marginBottom: "4px" }}>
                  Customer Posing & Concept Details
                </span>
                <p style={{ margin: 0, fontSize: "13px", lineHeight: 1.5, background: "#f9fafb", padding: "10px", borderRadius: "4px" }}>
                  {selectedReq.description}
                </p>
              </div>
            )}

            {/* Reference Photos */}
            <div style={{ marginBottom: "16px" }}>
              <span style={{ color: "var(--admin-muted)", fontSize: "11px", display: "block", marginBottom: "6px" }}>
                Reference Photos ({selectedReq.images.length})
              </span>
              {selectedReq.images.length === 0 ? (
                <span style={{ fontSize: "12px", color: "var(--admin-muted)" }}>No images uploaded.</span>
              ) : (
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {selectedReq.images.map((img) => (
                    <a
                      key={img.id}
                      href={img.downloadUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "block",
                        width: "100px",
                        height: "100px",
                        borderRadius: "4px",
                        overflow: "hidden",
                        border: "1px solid var(--admin-border)",
                      }}
                    >
                      <img
                        src={img.downloadUrl || "/images/figures/placeholder.jpg"}
                        alt={img.fileName}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Internal Notes Editor */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "11px", fontWeight: 700, display: "block", marginBottom: "4px" }}>
                Internal Production & Slicing Notes (Owner/Technician only)
              </label>
              <textarea
                rows={3}
                placeholder="Internal notes on resin weight, STL slicing angles, support requirements..."
                defaultValue={selectedReq.internalNotes || ""}
                onChange={(e) => setStatusNote(e.target.value)}
                style={{ width: "100%", padding: "8px 10px", fontSize: "12px", border: "1px solid var(--admin-border)", borderRadius: "4px" }}
              />
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                style={{ marginTop: "6px", fontSize: "11px" }}
                onClick={() => handleStatusChange(selectedReq.status)}
                disabled={actionLoading}
              >
                Save Notes
              </button>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setSelectedReq(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
