"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Printer,
  ShieldCheck,
  CreditCard,
  Wallet,
  Truck,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Check,
  ChevronRight,
  LoaderCircle,
} from "lucide-react";
import { Container } from "@/components/ui/Primitives";
import { authService, CustomerSession } from "@/lib/auth-service";
import {
  getPrintingRequest,
  approvePrintingQuotation,
  rejectPrintingQuotation,
  initiatePayment,
} from "@/lib/commerce-api";
import type { PrintingRequestDto, PrintingQuotationDto } from "@himatu/shared";

const PRODUCTION_STAGES = [
  { key: "3D_MODELING", label: "3D Sculpting", desc: "Digital topology sculpting & dynamic pose modeling" },
  { key: "MODEL_SLICING", label: "Model Slicing", desc: "Orientation, support generation & layer analysis" },
  { key: "PRINTING_STARTED", label: "8K Printing", desc: "Photopolymer SLA vat printing at 0.02mm layers" },
  { key: "PRINT_CLEANUP_CURING", label: "IPA Wash & UV", desc: "Ultrasonic cleaning & multi-wavelength post-curing" },
  { key: "SURFACE_PRIMING", label: "Sanding & Primer", desc: "Support scar removal, micromesh sanding & primer" },
  { key: "AIRBRUSH_BASE", label: "Airbrush Shading", desc: "Base coat gradient shading and skin tones" },
  { key: "DETAIL_HAND_PAINTING", label: "Hand-Painting", desc: "Detailed brushwork for eyes, hair and costume" },
  { key: "CLEAR_COAT_FINISH", label: "Protective Sealer", desc: "Matte/gloss topcoat UV and scratch resistance" },
  { key: "QUALITY_INSPECTION", label: "Quality Audit", desc: "Optical inspection and structural balance test" },
  { key: "PACKED_FOR_DELIVERY", label: "Dispatched", desc: "Velvet-lined shockproof box delivery" },
];

export default function PrintingRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [session, setSession] = useState<CustomerSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<PrintingRequestDto | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedPayMethod, setSelectedPayMethod] = useState<"BKASH" | "SSLCOMMERZ" | "COD">("BKASH");
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState("");

  const loadData = async (token?: string) => {
    try {
      const data = await getPrintingRequest(resolvedParams.id, token);
      setRequest(data);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Failed to load printing request details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    authService.getSession().then((s) => {
      setSession(s);
      loadData(s?.accessToken);
    });
  }, [resolvedParams.id]);

  const formatBDT = (amount: number) =>
    `৳${new Intl.NumberFormat("en-BD").format(amount)}`;

  const handleApprove = async () => {
    if (!session?.accessToken) {
      router.push(`/sign-in?next=/account/printing-requests/${resolvedParams.id}`);
      return;
    }

    setActionLoading(true);
    setErrorMessage(null);

    try {
      // 1. Approve quote and generate linked order
      const result = await approvePrintingQuotation(resolvedParams.id, session.accessToken);

      // 2. Initiate payment for the deposit
      const payResult = await initiatePayment(
        {
          orderId: result.orderId,
          provider: selectedPayMethod,
        },
        session.accessToken,
      );

      // 3. Route to payment portal or result
      if (selectedPayMethod === "COD") {
        router.push(`/order-confirmation?orderNumber=${encodeURIComponent(result.orderNumber)}`);
      } else if (payResult.paymentUrl) {
        window.location.href = payResult.paymentUrl;
      } else {
        router.push(
          `/checkout/payment-result?provider=${selectedPayMethod}&trxRef=${encodeURIComponent(
            payResult.transactionRef,
          )}&orderNumber=${encodeURIComponent(result.orderNumber)}&status=PENDING`,
        );
      }
    } catch (err: any) {
      console.error("Approval error:", err);
      setErrorMessage(err.message || "Failed to accept quotation. Please try again.");
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    setActionLoading(true);
    try {
      await rejectPrintingQuotation(resolvedParams.id, declineReason, session?.accessToken);
      setShowDeclineModal(false);
      await loadData(session?.accessToken);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to decline quotation.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="page-content" style={{ padding: "80px 20px", textAlign: "center" }}>
        <p style={{ fontWeight: 700 }}>LOADING 3D COMMISSION DOSSIER…</p>
      </Container>
    );
  }

  if (!request) {
    return (
      <Container className="page-content" style={{ padding: "60px 20px", textAlign: "center" }}>
        <h2>REQUEST NOT FOUND</h2>
        <Link href="/account/printing-requests" className="button button--secondary" style={{ marginTop: "16px" }}>
          RETURN TO COMMISSIONS
        </Link>
      </Container>
    );
  }

  const activeQuote = request.quotations?.find((q) => q.status === "PENDING");
  const acceptedQuote = request.quotations?.find((q) => q.status === "ACCEPTED");
  const production = request.production;

  // Find current stage index in pipeline
  const currentStageIndex = production
    ? PRODUCTION_STAGES.findIndex((s) => s.key === production.stage)
    : -1;

  return (
    <Container className="page-content" style={{ maxWidth: "980px", margin: "40px auto" }}>
      <div style={{ marginBottom: "24px" }}>
        <Link
          href="/account/printing-requests"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "13px",
            color: "var(--muted)",
            textDecoration: "none",
            marginBottom: "12px",
          }}
        >
          <ArrowLeft size={14} /> BACK TO COMMISSIONS
        </Link>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <code style={{ fontSize: "14px", fontWeight: 800 }}>{request.requestNumber}</code>
              <span
                style={{
                  padding: "4px 8px",
                  borderRadius: "3px",
                  fontSize: "11px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  background:
                    request.status === "QUOTED"
                      ? "#dbeafe"
                      : request.status === "IN_PRODUCTION"
                        ? "#f3e8ff"
                        : request.status === "COMPLETED"
                          ? "#dcfce7"
                          : "#f3f4f6",
                  color:
                    request.status === "QUOTED"
                      ? "#1e40af"
                      : request.status === "IN_PRODUCTION"
                        ? "#6b21a8"
                        : request.status === "COMPLETED"
                          ? "#166534"
                          : "#374151",
                }}
              >
                {request.status.replace(/_/g, " ")}
              </span>
            </div>
            <h1 style={{ fontSize: "28px", fontWeight: 900, margin: 0 }}>{request.title}</h1>
            <p style={{ color: "var(--muted)", fontSize: "14px", margin: "4px 0 0" }}>
              {request.characterName} ({request.animeName}) · Submitted on {new Date(request.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div style={{ padding: "12px 16px", background: "#fef2f2", border: "1px solid #f87171", color: "#991b1b", fontSize: "13px", borderRadius: "4px", marginBottom: "24px" }}>
          {errorMessage}
        </div>
      )}

      {/* SECTION 1: OFFICIAL QUOTATION (If Quoted & Pending Approval) */}
      {activeQuote && (
        <div
          style={{
            border: "2px solid #2563eb",
            borderRadius: "6px",
            background: "#ffffff",
            padding: "32px",
            marginBottom: "32px",
            boxShadow: "0 10px 25px -5px rgba(37, 99, 235, 0.1)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", borderBottom: "1px solid #e5e7eb", paddingBottom: "16px", marginBottom: "20px" }}>
            <div>
              <span style={{ fontSize: "11px", fontWeight: 800, color: "#2563eb", letterSpacing: "0.1em" }}>
                OFFICIAL BDT QUOTATION
              </span>
              <h2 style={{ fontSize: "22px", fontWeight: 900, margin: "4px 0" }}>
                {activeQuote.quotationNumber}
              </h2>
              <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0 }}>
                Valid until {new Date(activeQuote.validUntil).toLocaleDateString()} (14-day price lock)
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "12px", color: "var(--muted)" }}>50% Commitment Deposit</div>
              <div style={{ fontSize: "26px", fontWeight: 900, color: "#2563eb" }}>
                {formatBDT(activeQuote.depositAmount)}
              </div>
              <div style={{ fontSize: "12px", color: "#6b7280" }}>
                Total Figure Fee: <strong>{formatBDT(activeQuote.totalAmount)}</strong>
              </div>
            </div>
          </div>

          {/* Itemized Cost Breakdown Table */}
          <div style={{ marginBottom: "24px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "12px" }}>
              Itemized Cost Breakdown
            </h3>
            <div style={{ border: "1px solid #e5e7eb", borderRadius: "4px", overflow: "hidden", fontSize: "13px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                <span>1. Digital 3D Sculpting & CAD Modeling</span>
                <strong>{formatBDT(activeQuote.baseCost)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderBottom: "1px solid #e5e7eb" }}>
                <span>2. 8K High-Definition Photopolymer Resin Material</span>
                <strong>{formatBDT(activeQuote.materialCost)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                <span>3. Precision SLA Layer Slicing & Machine Run-Time</span>
                <strong>{formatBDT(activeQuote.printingCost)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderBottom: "1px solid #e5e7eb" }}>
                <span>4. Ultrasonic IPA Wash, Support Removal & UV Post-Cure</span>
                <strong>{formatBDT(activeQuote.finishingCost)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                <span>5. Master Hand-Painting (Airbrush Gradients, Anime Eyes & Detailing)</span>
                <strong>{formatBDT(activeQuote.paintingCost)}</strong>
              </div>
              {activeQuote.customizationCost > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderBottom: "1px solid #e5e7eb" }}>
                  <span>6. Custom Diorama Base & Dynamic FX</span>
                  <strong>{formatBDT(activeQuote.customizationCost)}</strong>
                </div>
              )}
              {activeQuote.discountAmount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "#ecfdf5", color: "#065f46" }}>
                  <span>Promotional Collector Privilege Discount</span>
                  <strong>-{formatBDT(activeQuote.discountAmount)}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Schedule & Terms */}
          <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "4px", fontSize: "13px", color: "#334155", marginBottom: "24px", lineHeight: 1.6 }}>
            <p style={{ margin: "0 0 6px" }}>
              <strong>Production Schedule:</strong> Estimated at {activeQuote.productionDays} business days from deposit payment.
            </p>
            <p style={{ margin: 0 }}>
              <strong>Terms:</strong> {activeQuote.termsAndNotes}
            </p>
          </div>

          {/* Deposit Payment Selector */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}>
              SELECT PAYMENT METHOD FOR 50% DEPOSIT ({formatBDT(activeQuote.depositAmount)}):
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setSelectedPayMethod("BKASH")}
                style={{
                  padding: "12px",
                  borderRadius: "4px",
                  border: selectedPayMethod === "BKASH" ? "2px solid #e2136e" : "1px solid #e5e7eb",
                  background: selectedPayMethod === "BKASH" ? "#fdf2f8" : "#ffffff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontWeight: 700,
                  fontSize: "13px",
                }}
              >
                <Wallet size={16} color="#e2136e" /> bKash Direct
              </button>

              <button
                type="button"
                onClick={() => setSelectedPayMethod("SSLCOMMERZ")}
                style={{
                  padding: "12px",
                  borderRadius: "4px",
                  border: selectedPayMethod === "SSLCOMMERZ" ? "2px solid #2563eb" : "1px solid #e5e7eb",
                  background: selectedPayMethod === "SSLCOMMERZ" ? "#eff6ff" : "#ffffff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontWeight: 700,
                  fontSize: "13px",
                }}
              >
                <CreditCard size={16} color="#2563eb" /> Cards / NetBanking
              </button>

              <button
                type="button"
                onClick={() => setSelectedPayMethod("COD")}
                style={{
                  padding: "12px",
                  borderRadius: "4px",
                  border: selectedPayMethod === "COD" ? "2px solid #16a34a" : "1px solid #e5e7eb",
                  background: selectedPayMethod === "COD" ? "#f0fdf4" : "#ffffff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontWeight: 700,
                  fontSize: "13px",
                }}
              >
                <Truck size={16} color="#16a34a" /> Cash on Delivery
              </button>
            </div>
          </div>

          {/* Action CTAs */}
          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => setShowDeclineModal(true)}
              disabled={actionLoading}
            >
              DECLINE QUOTATION
            </button>

            <button
              type="button"
              className="button button--primary"
              onClick={handleApprove}
              disabled={actionLoading}
              style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
            >
              {actionLoading ? (
                <>
                  <LoaderCircle size={16} className="animate-spin" /> ESTABLISHING ORDER…
                </>
              ) : (
                <>
                  <Check size={16} /> ACCEPT & PAY DEPOSIT ({formatBDT(activeQuote.depositAmount)})
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* SECTION 2: 10-STAGE PRODUCTION PIPELINE (If In Production) */}
      {production && (
        <div style={{ border: "1px solid var(--border)", borderRadius: "6px", background: "#ffffff", padding: "32px", marginBottom: "32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <div>
              <p className="eyebrow" style={{ margin: "0 0 4px" }}>WORKBENCH PROGRESS</p>
              <h2 style={{ fontSize: "20px", fontWeight: 900, margin: 0 }}>10-Stage Fabrication Pipeline</h2>
            </div>
            {production.orderId && (
              <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                Order #{production.orderNumber || "Custom"}
              </span>
            )}
          </div>

          {/* Pipeline Stepper Progress */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px", marginBottom: "32px" }}>
            {PRODUCTION_STAGES.map((stg, idx) => {
              const isPast = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;

              return (
                <div
                  key={stg.key}
                  style={{
                    padding: "10px",
                    borderRadius: "4px",
                    border: isCurrent
                      ? "2px solid #2563eb"
                      : isPast
                        ? "1px solid #16a34a"
                        : "1px solid #e5e7eb",
                    background: isCurrent ? "#eff6ff" : isPast ? "#f0fdf4" : "#fafafa",
                    textAlign: "left",
                  }}
                >
                  <div style={{ fontSize: "10px", fontWeight: 800, color: isCurrent ? "#2563eb" : isPast ? "#16a34a" : "#9ca3af" }}>
                    STEP {String(idx + 1).padStart(2, "0")}
                  </div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: isCurrent ? "#1e40af" : isPast ? "#14532d" : "#374151" }}>
                    {stg.label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Milestone Updates Log */}
          <div>
            <h3 style={{ fontSize: "14px", fontWeight: 800, textTransform: "uppercase", marginBottom: "16px" }}>
              Technician Milestone Logs
            </h3>
            {production.updates.length === 0 ? (
              <p style={{ color: "var(--muted)", fontSize: "13px" }}>No milestone updates logged yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {production.updates.map((upd) => (
                  <div
                    key={upd.id}
                    style={{
                      border: "1px solid #f3f4f6",
                      borderRadius: "4px",
                      padding: "14px",
                      background: "#f9fafb",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "12px" }}>
                      <strong style={{ color: "#2563eb" }}>{upd.stage.replace(/_/g, " ")}</strong>
                      <span style={{ color: "#9ca3af" }}>{new Date(upd.createdAt).toLocaleString()}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: "13px", lineHeight: 1.5 }}>{upd.customerMessage}</p>
                    {upd.progressImageUrl && (
                      <div style={{ marginTop: "10px" }}>
                        <img
                          src={upd.progressImageUrl}
                          alt="Progress"
                          style={{ maxWidth: "200px", maxHeight: "150px", borderRadius: "4px", objectFit: "cover" }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 3: SPECIFICATIONS & REFERENCE IMAGES */}
      <div style={{ border: "1px solid var(--border)", borderRadius: "6px", background: "#ffffff", padding: "32px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 900, marginBottom: "16px" }}>
          Figure Configuration & References
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px", fontSize: "13px", marginBottom: "24px" }}>
          <div>
            <span style={{ color: "var(--muted)", display: "block" }}>Scale</span>
            <strong>{request.sizePreference || "Standard 1/7 Scale"}</strong>
          </div>
          <div>
            <span style={{ color: "var(--muted)", display: "block" }}>Material</span>
            <strong>{request.materialPreference || "8K SLA Resin"}</strong>
          </div>
          <div>
            <span style={{ color: "var(--muted)", display: "block" }}>Finish Level</span>
            <strong>{request.finishPreference || "Master Hand-Painted"}</strong>
          </div>
          <div>
            <span style={{ color: "var(--muted)", display: "block" }}>Character & Franchise</span>
            <strong>{request.characterName} ({request.animeName})</strong>
          </div>
        </div>

        {request.description && (
          <div style={{ marginBottom: "24px" }}>
            <span style={{ color: "var(--muted)", fontSize: "12px", display: "block", marginBottom: "4px" }}>
              Posing & Concept Instructions
            </span>
            <p style={{ margin: 0, fontSize: "13px", lineHeight: 1.6, background: "#f9fafb", padding: "12px", borderRadius: "4px" }}>
              {request.description}
            </p>
          </div>
        )}

        {/* References Gallery */}
        <div>
          <span style={{ color: "var(--muted)", fontSize: "12px", display: "block", marginBottom: "8px" }}>
            Reference Images ({request.images.length})
          </span>
          {request.images.length === 0 ? (
            <p style={{ fontSize: "13px", color: "var(--muted)" }}>No reference images attached.</p>
          ) : (
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {request.images.map((img) => (
                <a
                  key={img.id}
                  href={img.downloadUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "block",
                    width: "120px",
                    height: "120px",
                    borderRadius: "4px",
                    overflow: "hidden",
                    border: "1px solid var(--border)",
                    position: "relative",
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
      </div>

      {/* Decline Reason Modal */}
      {showDeclineModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              padding: "28px",
              borderRadius: "6px",
              maxWidth: "460px",
              width: "100%",
            }}
          >
            <h3 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 8px" }}>Decline Quotation</h3>
            <p style={{ fontSize: "13px", color: "var(--muted)", margin: "0 0 16px" }}>
              Let our artisans know why you are declining (e.g. price adjustment, timeline change, scale modification):
            </p>
            <textarea
              rows={3}
              style={{ width: "100%", padding: "10px", border: "1px solid var(--border)", marginBottom: "16px", fontSize: "13px" }}
              placeholder="Reason for declining..."
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="button button--secondary"
                onClick={() => setShowDeclineModal(false)}
              >
                CANCEL
              </button>
              <button
                type="button"
                className="button button--primary"
                onClick={handleReject}
                disabled={actionLoading}
              >
                CONFIRM DECLINE
              </button>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
}

