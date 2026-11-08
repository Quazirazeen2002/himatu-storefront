"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  Layers,
  CheckCircle2,
  Clock,
  Printer,
  RefreshCw,
  Plus,
  X,
  MessageSquare,
  Upload,
} from "lucide-react";
import { authService, CustomerSession } from "@/lib/auth-service";
import {
  getAdminProductionBoard,
  updateAdminProductionStage,
  addAdminProductionUpdate,
} from "@/lib/commerce-api";
import type { ProductionStage } from "@himatu/shared";

const STAGE_LABELS: Record<string, string> = {
  "3D_MODELING": "1. 3D Sculpting",
  "MODEL_SLICING": "2. Model Slicing",
  "PRINTING_STARTED": "3. 8K SLA Printing",
  "PRINT_CLEANUP_CURING": "4. IPA Wash & UV",
  "SURFACE_PRIMING": "5. Sanding & Primer",
  "AIRBRUSH_BASE": "6. Airbrush Base",
  "DETAIL_HAND_PAINTING": "7. Hand-Painting",
  "CLEAR_COAT_FINISH": "8. Topcoat Seal",
  "QUALITY_INSPECTION": "9. QA Inspection",
  "PACKED_FOR_DELIVERY": "10. Dispatched",
};

export function ProductionKanban() {
  const [session, setSession] = useState<CustomerSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [board, setBoard] = useState<{
    stages: ProductionStage[];
    totalActive: number;
    columns: Record<string, any[]>;
  } | null>(null);

  // Milestone Update Modal State
  const [activeItem, setActiveItem] = useState<any | null>(null);
  const [customerMessage, setCustomerMessage] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [progressImageUrl, setProgressImageUrl] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadData = async (token: string) => {
    try {
      const data = await getAdminProductionBoard(token);
      setBoard(data);
    } catch (err: any) {
      console.error(err);
      setFeedback({ type: "error", text: err.message || "Failed to load production board." });
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
  }, []);

  const handleAdvance = async (itemId: string, currentStage: string) => {
    if (!session?.accessToken || !board) return;
    const currentIndex = board.stages.indexOf(currentStage as ProductionStage);
    if (currentIndex === -1 || currentIndex >= board.stages.length - 1) return;

    const nextStage = board.stages[currentIndex + 1];
    setActionLoading(true);
    setFeedback(null);

    try {
      await updateAdminProductionStage(session.accessToken, itemId, {
        stage: nextStage,
      });
      setFeedback({
        type: "success",
        text: `Figure advanced to ${STAGE_LABELS[nextStage] || nextStage}.`,
      });
      await loadData(session.accessToken);
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed to transition stage." });
    } finally {
      setActionLoading(false);
    }
  };

  const handlePostUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.accessToken || !activeItem) return;
    setActionLoading(true);
    setFeedback(null);

    try {
      await addAdminProductionUpdate(session.accessToken, activeItem.id, {
        stage: activeItem.stage,
        customerMessage,
        internalNote: internalNote || undefined,
        progressImageUrl: progressImageUrl || undefined,
      });
      setFeedback({ type: "success", text: "Milestone progress log published to customer timeline." });
      setActiveItem(null);
      setCustomerMessage("");
      setInternalNote("");
      setProgressImageUrl("");
      await loadData(session.accessToken);
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed to post update." });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <div className="admin-page-header">
        <div className="admin-page-title-group">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <Link
              href="/admin/3d-printing"
              style={{ fontSize: "12px", color: "var(--admin-muted)", textDecoration: "none" }}
            >
              ← Back to Requests & Quotations
            </Link>
          </div>
          <h1>3D Figurine Fabrication Kanban</h1>
          <p>Real-time 10-stage manufacturing pipeline tracking and progress log dispatch.</p>
        </div>

        <button
          type="button"
          className="admin-btn admin-btn-secondary"
          onClick={() => session?.accessToken && loadData(session.accessToken)}
          disabled={actionLoading}
        >
          <RefreshCw size={14} className={actionLoading ? "animate-spin" : ""} /> Refresh Pipeline
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

      {loading ? (
        <p style={{ padding: "40px", fontWeight: 700 }}>LOADING KANBAN PIPELINE…</p>
      ) : !board ? (
        <p>Failed to load Kanban board.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridAutoFlow: "column",
            gridAutoColumns: "280px",
            gap: "14px",
            overflowX: "auto",
            paddingBottom: "24px",
          }}
        >
          {board.stages.map((stageKey) => {
            const items = board.columns[stageKey] || [];
            const isCompletedStage = stageKey === "PACKED_FOR_DELIVERY";

            return (
              <div
                key={stageKey}
                style={{
                  background: "#f8fafc",
                  border: "1px solid var(--admin-border)",
                  borderRadius: "6px",
                  display: "flex",
                  flexDirection: "column",
                  maxHeight: "75vh",
                }}
              >
                {/* Column Header */}
                <div
                  style={{
                    padding: "12px 14px",
                    borderBottom: "1px solid var(--admin-border)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "#ffffff",
                    borderTopLeftRadius: "6px",
                    borderTopRightRadius: "6px",
                  }}
                >
                  <span style={{ fontSize: "12px", fontWeight: 800 }}>
                    {STAGE_LABELS[stageKey] || stageKey}
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      background: items.length > 0 ? "#e2e8f0" : "#f1f5f9",
                      padding: "2px 6px",
                      borderRadius: "10px",
                    }}
                  >
                    {items.length}
                  </span>
                </div>

                {/* Column Cards Container */}
                <div
                  style={{
                    padding: "10px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    overflowY: "auto",
                    flex: 1,
                  }}
                >
                  {items.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "24px 8px", color: "var(--admin-muted)", fontSize: "11px" }}>
                      No figures at this stage
                    </div>
                  ) : (
                    items.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          background: "#ffffff",
                          border: "1px solid var(--admin-border)",
                          borderRadius: "4px",
                          padding: "12px",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                          <code style={{ fontSize: "11px", fontWeight: 800 }}>{item.requestNumber}</code>
                          {item.orderNumber && (
                            <span style={{ fontSize: "10px", color: "#64748b" }}>Order #{item.orderNumber}</span>
                          )}
                        </div>

                        <strong style={{ fontSize: "13px", display: "block", marginBottom: "2px" }}>
                          {item.title}
                        </strong>
                        <div style={{ fontSize: "11px", color: "var(--admin-muted)", marginBottom: "8px" }}>
                          {item.characterName} · {item.customerName}
                        </div>

                        {item.lastUpdate && (
                          <div
                            style={{
                              background: "#f1f5f9",
                              padding: "6px 8px",
                              borderRadius: "3px",
                              fontSize: "11px",
                              color: "#334155",
                              marginBottom: "8px",
                              lineHeight: 1.4,
                            }}
                          >
                            {item.lastUpdate.customerMessage}
                          </div>
                        )}

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px", paddingTop: "8px", borderTop: "1px solid #f1f5f9" }}>
                          <button
                            type="button"
                            className="admin-btn admin-btn-secondary"
                            style={{ padding: "3px 6px", fontSize: "10px" }}
                            title="Post milestone photo or message"
                            onClick={() => {
                              setActiveItem(item);
                              setCustomerMessage(`Figure is now advancing in stage: ${STAGE_LABELS[item.stage]}.`);
                            }}
                          >
                            <MessageSquare size={11} /> Update
                          </button>

                          {!isCompletedStage && (
                            <button
                              type="button"
                              className="admin-btn admin-btn-primary"
                              style={{ padding: "3px 8px", fontSize: "10px", display: "inline-flex", alignItems: "center", gap: "3px" }}
                              onClick={() => handleAdvance(item.id, item.stage)}
                              disabled={actionLoading}
                            >
                              Advance <ChevronRight size={11} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Post Milestone Update Modal */}
      {activeItem && (
        <div className="admin-modal-backdrop" onClick={() => setActiveItem(null)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "520px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: 800, margin: 0 }}>Publish Milestone Update</h2>
                <p style={{ fontSize: "12px", color: "var(--admin-muted)", margin: "2px 0 0" }}>
                  {activeItem.requestNumber} · {activeItem.characterName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveItem(null)}
                style={{ background: "transparent", border: "none", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePostUpdate}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "12px", fontWeight: 700, display: "block", marginBottom: "4px" }}>
                  Customer-Facing Milestone Message *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Master sculpting completed. Figure supports have been analyzed and model is now loaded on the 8K SLA printer."
                  value={customerMessage}
                  onChange={(e) => setCustomerMessage(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", fontSize: "13px", border: "1px solid var(--admin-border)", borderRadius: "4px" }}
                />
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "12px", fontWeight: 700, display: "block", marginBottom: "4px" }}>
                  Progress Photo URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={progressImageUrl}
                  onChange={(e) => setProgressImageUrl(e.target.value)}
                  style={{ width: "100%", padding: "6px 10px", fontSize: "13px", border: "1px solid var(--admin-border)", borderRadius: "4px" }}
                />
                <span style={{ fontSize: "11px", color: "var(--admin-muted)" }}>
                  Customer can see this preview photo in their tracking dossier.
                </span>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ fontSize: "12px", fontWeight: 700, display: "block", marginBottom: "4px" }}>
                  Internal Workshop Note (Staff Only)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cured with 405nm light for 8 minutes. No warping detected."
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  style={{ width: "100%", padding: "6px 10px", fontSize: "13px", border: "1px solid var(--admin-border)", borderRadius: "4px" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={() => setActiveItem(null)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  disabled={actionLoading || !customerMessage.trim()}
                >
                  {actionLoading ? "Publishing…" : "Post Milestone Log"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

