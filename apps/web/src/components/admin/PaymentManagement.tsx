"use client";

import { useEffect, useState } from "react";
import {
  CreditCard,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  Truck,
  ShieldCheck,
  RefreshCw,
  Search,
  RotateCcw,
  Eye,
  X,
  Wallet,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { authService, CustomerSession } from "@/lib/auth-service";
import {
  getAdminPayments,
  getAdminPaymentSummary,
  reconcilePayment,
  refundPayment,
} from "@/lib/commerce-api";
import type { PaymentTransactionDto } from "@himatu/shared";

export function PaymentManagement() {
  const [session, setSession] = useState<CustomerSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<PaymentTransactionDto[]>([]);
  const [summary, setSummary] = useState<any>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [providerFilter, setProviderFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Modals & Action States
  const [selectedTxn, setSelectedTxn] = useState<PaymentTransactionDto | null>(null);
  const [refundTxn, setRefundTxn] = useState<PaymentTransactionDto | null>(null);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundReason, setRefundReason] = useState<string>("");
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadData = async (token: string) => {
    try {
      const [txnData, sumData] = await Promise.all([
        getAdminPayments(token, {
          page,
          limit: 20,
          status: statusFilter === "ALL" ? undefined : statusFilter,
          provider: providerFilter === "ALL" ? undefined : providerFilter,
          search: searchQuery || undefined,
        }),
        getAdminPaymentSummary(token).catch(() => null),
      ]);

      setTransactions(Array.isArray(txnData?.items) ? txnData.items : []);
      setTotal(txnData?.total || 0);
      if (sumData) setSummary(sumData);
    } catch (err: any) {
      console.error("Failed to load payments:", err);
      setFeedback({ type: "error", text: err.message || "Failed to load payment transactions." });
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
  }, [page, statusFilter, providerFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (session?.accessToken) {
      setPage(1);
      loadData(session.accessToken);
    }
  };

  const handleReconcile = async (txnId: string) => {
    if (!session?.accessToken) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await reconcilePayment(session.accessToken, txnId);
      setFeedback({ type: "success", text: res.message });
      await loadData(session.accessToken);
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Reconciliation failed." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleProcessRefund = async () => {
    if (!session?.accessToken || !refundTxn) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      await refundPayment(session.accessToken, refundTxn.id, {
        amount: refundAmount,
        reason: refundReason,
      });
      setFeedback({ type: "success", text: `Refund of ৳${refundAmount} processed successfully.` });
      setRefundTxn(null);
      setRefundAmount(0);
      setRefundReason("");
      await loadData(session.accessToken);
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Refund processing failed." });
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
          <h1>Payment Gateways & Settlement Reconciliations</h1>
          <p>Multi-channel transactions, automated bKash, SSLCOMMERZ gateway verification, and refunds.</p>
        </div>
        <button
          type="button"
          className="admin-btn admin-btn-secondary"
          onClick={() => session?.accessToken && loadData(session.accessToken)}
          disabled={actionLoading}
        >
          <RefreshCw size={14} className={actionLoading ? "animate-spin" : ""} /> Refresh Data
        </button>
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

      {/* KPI Cards */}
      <div className="admin-kpi-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: "24px" }}>
        <div className="admin-kpi-card">
          <div className="admin-kpi-top">
            <span className="admin-kpi-label">Settled & Paid Volume</span>
            <div className="admin-kpi-icon" style={{ color: "var(--admin-success)" }}>
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="admin-kpi-value" style={{ color: "var(--admin-success)" }}>
            {formatBDT(summary?.paidVolume || 0)}
          </div>
          <div className="admin-kpi-subtext">{summary?.paidCount || 0} completed transactions</div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-top">
            <span className="admin-kpi-label">Pending Settlements</span>
            <div className="admin-kpi-icon" style={{ color: "#d97706" }}>
              <Clock size={16} />
            </div>
          </div>
          <div className="admin-kpi-value" style={{ color: "#d97706" }}>
            {summary?.pendingCount || 0}
          </div>
          <div className="admin-kpi-subtext">Awaiting courier or bank confirmation</div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-top">
            <span className="admin-kpi-label">Refunds Processed</span>
            <div className="admin-kpi-icon" style={{ color: "#dc2626" }}>
              <RotateCcw size={16} />
            </div>
          </div>
          <div className="admin-kpi-value" style={{ color: "#dc2626" }}>
            {formatBDT(summary?.refundedVolume || 0)}
          </div>
          <div className="admin-kpi-subtext">Total refunded back to customers</div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-top">
            <span className="admin-kpi-label">Gateway Channel Share</span>
            <div className="admin-kpi-icon" style={{ color: "var(--admin-text)" }}>
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="admin-kpi-value" style={{ fontSize: "16px", paddingTop: "6px" }}>
            {summary?.byProvider?.map((p: any) => `${p.provider}: ${p.count}`).join(" · ") || "All channels live"}
          </div>
          <div className="admin-kpi-subtext">bKash · SSLCOMMERZ · Cash on Delivery</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="admin-card" style={{ marginBottom: "20px", padding: "16px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          {/* Status Filter */}
          <div style={{ display: "flex", gap: "8px" }}>
            {["ALL", "PAID", "PENDING", "FAILED", "REFUNDED"].map((st) => (
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
                {st}
              </button>
            ))}
          </div>

          {/* Provider Filter */}
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "var(--admin-muted)", fontWeight: 600 }}>Provider:</span>
            {["ALL", "BKASH", "SSLCOMMERZ", "COD"].map((pr) => (
              <button
                key={pr}
                type="button"
                className={`admin-btn ${providerFilter === pr ? "admin-btn-primary" : "admin-btn-secondary"}`}
                style={{ fontSize: "12px", padding: "6px 10px" }}
                onClick={() => {
                  setProviderFilter(pr);
                  setPage(1);
                }}
              >
                {pr}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "8px" }}>
            <div style={{ position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: "10px", top: "10px", color: "var(--admin-muted)" }} />
              <input
                type="text"
                placeholder="Search ref, order, trxID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: "7px 12px 7px 30px",
                  fontSize: "12px",
                  border: "1px solid var(--admin-border)",
                  borderRadius: "4px",
                  width: "220px",
                }}
              />
            </div>
            <button type="submit" className="admin-btn admin-btn-secondary" style={{ fontSize: "12px" }}>
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Transactions Data Table */}
      <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Transaction Ref</th>
              <th>Order</th>
              <th>Customer</th>
              <th>Provider</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Verification</th>
              <th>Date</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", padding: "40px" }}>
                  Loading transaction data…
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", padding: "40px", color: "var(--admin-muted)" }}>
                  No payment transactions match the selected criteria.
                </td>
              </tr>
            ) : (
              transactions.map((txn) => {
                const isPaid = txn.status === "PAID";
                const isPending = txn.status === "PENDING";
                const isFailed = txn.status === "FAILED";
                const isRefunded = txn.status === "REFUNDED";

                return (
                  <tr key={txn.id}>
                    <td>
                      <code style={{ fontSize: "12px", fontWeight: 700 }}>{txn.transactionRef}</code>
                      {txn.providerTransactionId && (
                        <div style={{ fontSize: "11px", color: "var(--admin-muted)" }}>
                          Trx: {txn.providerTransactionId}
                        </div>
                      )}
                    </td>
                    <td>
                      <strong style={{ fontSize: "12px" }}>{txn.orderNumber || "—"}</strong>
                    </td>
                    <td>
                      <div style={{ fontSize: "12px", fontWeight: 600 }}>{txn.customerName || "Customer"}</div>
                      <div style={{ fontSize: "11px", color: "var(--admin-muted)" }}>{txn.customerEmail || "—"}</div>
                    </td>
                    <td>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: "3px",
                          background:
                            txn.provider === "BKASH"
                              ? "#fdf2f8"
                              : txn.provider === "SSLCOMMERZ"
                                ? "#eff6ff"
                                : "#f3f4f6",
                          color:
                            txn.provider === "BKASH"
                              ? "#e2136e"
                              : txn.provider === "SSLCOMMERZ"
                                ? "#2563eb"
                                : "#374151",
                        }}
                      >
                        {txn.provider === "BKASH" && <Wallet size={11} />}
                        {txn.provider === "SSLCOMMERZ" && <CreditCard size={11} />}
                        {txn.provider === "COD" && <Truck size={11} />}
                        {txn.provider}
                      </span>
                    </td>
                    <td>
                      <strong style={{ fontSize: "13px" }}>{formatBDT(txn.amount)}</strong>
                    </td>
                    <td>
                      <span
                        className={`admin-status-badge ${
                          isPaid
                            ? "status-paid"
                            : isPending
                              ? "status-pending"
                              : isRefunded
                                ? "status-cancelled"
                                : "status-unfulfilled"
                        }`}
                      >
                        {txn.status}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          color:
                            txn.verificationStatus === "VERIFIED"
                              ? "var(--admin-success)"
                              : txn.verificationStatus === "FAILED"
                                ? "#dc2626"
                                : "var(--admin-muted)",
                        }}
                      >
                        {txn.verificationStatus}
                      </span>
                    </td>
                    <td style={{ fontSize: "12px", color: "var(--admin-muted)" }}>
                      {new Date(txn.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        <button
                          type="button"
                          className="admin-btn admin-btn-secondary"
                          style={{ padding: "4px 8px", fontSize: "11px" }}
                          title="Reconcile with gateway"
                          onClick={() => handleReconcile(txn.id)}
                          disabled={actionLoading}
                        >
                          <RefreshCw size={12} />
                        </button>

                        {isPaid && (
                          <button
                            type="button"
                            className="admin-btn admin-btn-secondary"
                            style={{ padding: "4px 8px", fontSize: "11px", color: "#dc2626" }}
                            title="Process Refund"
                            onClick={() => {
                              setRefundTxn(txn);
                              setRefundAmount(txn.amount);
                            }}
                          >
                            <RotateCcw size={12} />
                          </button>
                        )}

                        <button
                          type="button"
                          className="admin-btn admin-btn-secondary"
                          style={{ padding: "4px 8px", fontSize: "11px" }}
                          title="View Details"
                          onClick={() => setSelectedTxn(txn)}
                        >
                          <Eye size={12} />
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

      {/* Transaction Details Modal */}
      {selectedTxn && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedTxn(null)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 800, margin: 0 }}>Payment Transaction Details</h2>
              <button
                type="button"
                onClick={() => setSelectedTxn(null)}
                style={{ background: "transparent", border: "none", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", fontSize: "13px", marginBottom: "20px" }}>
              <div>
                <span style={{ color: "var(--admin-muted)", display: "block" }}>Transaction Ref</span>
                <code>{selectedTxn.transactionRef}</code>
              </div>
              <div>
                <span style={{ color: "var(--admin-muted)", display: "block" }}>Order Number</span>
                <strong>{selectedTxn.orderNumber || "—"}</strong>
              </div>
              <div>
                <span style={{ color: "var(--admin-muted)", display: "block" }}>Provider</span>
                <strong>{selectedTxn.provider} ({selectedTxn.paymentMethod})</strong>
              </div>
              <div>
                <span style={{ color: "var(--admin-muted)", display: "block" }}>Amount</span>
                <strong>{formatBDT(selectedTxn.amount)}</strong>
              </div>
              <div>
                <span style={{ color: "var(--admin-muted)", display: "block" }}>Status</span>
                <strong>{selectedTxn.status} ({selectedTxn.verificationStatus})</strong>
              </div>
              <div>
                <span style={{ color: "var(--admin-muted)", display: "block" }}>Gateway Trx ID</span>
                <code>{selectedTxn.providerTransactionId || "N/A"}</code>
              </div>
            </div>

            {selectedTxn.events && selectedTxn.events.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <h3 style={{ fontSize: "14px", fontWeight: 700, margin: "0 0 10px" }}>Audit Event Timeline</h3>
                <div style={{ border: "1px solid var(--admin-border)", borderRadius: "4px", fontSize: "12px", maxHeight: "160px", overflowY: "auto" }}>
                  {selectedTxn.events.map((e) => (
                    <div key={e.id} style={{ padding: "8px 12px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between" }}>
                      <span>
                        <strong>{e.eventType}</strong> ({e.status})
                      </span>
                      <span style={{ color: "var(--admin-muted)" }}>{new Date(e.createdAt).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setSelectedTxn(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {refundTxn && (
        <div className="admin-modal-backdrop" onClick={() => setRefundTxn(null)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 8px" }}>Process Refund</h2>
            <p style={{ fontSize: "13px", color: "var(--admin-muted)", margin: "0 0 16px" }}>
              Transaction <code>{refundTxn.transactionRef}</code> ({formatBDT(refundTxn.amount)})
            </p>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                Refund Amount (BDT)
              </label>
              <input
                type="number"
                min={1}
                max={refundTxn.amount}
                value={refundAmount}
                onChange={(e) => setRefundAmount(parseInt(e.target.value, 10) || 0)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  fontSize: "14px",
                  border: "1px solid var(--admin-border)",
                  borderRadius: "4px",
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                Reason for Refund *
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Customer cancelled custom order, item damaged in transit, overpayment"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  fontSize: "13px",
                  border: "1px solid var(--admin-border)",
                  borderRadius: "4px",
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() => setRefundTxn(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                style={{ background: "#dc2626", borderColor: "#dc2626" }}
                onClick={handleProcessRefund}
                disabled={actionLoading || refundAmount <= 0 || !refundReason.trim()}
              >
                {actionLoading ? "Processing Refund…" : `Confirm Refund (${formatBDT(refundAmount)})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
