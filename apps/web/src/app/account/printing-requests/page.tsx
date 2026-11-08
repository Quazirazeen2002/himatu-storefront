"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Printer,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Plus,
  Layers,
  ChevronRight,
} from "lucide-react";
import { Container } from "@/components/ui/Primitives";
import { authService, CustomerSession } from "@/lib/auth-service";
import { getMyPrintingRequests } from "@/lib/commerce-api";
import type { PrintingRequestDto } from "@himatu/shared";

export default function PrintingRequestsPage() {
  const router = useRouter();
  const [session, setSession] = useState<CustomerSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<PrintingRequestDto[]>([]);

  useEffect(() => {
    authService.getSession().then((s) => {
      setSession(s);
      if (!s) {
        router.push("/sign-in?next=/account/printing-requests");
        return;
      }
      if (s.accessToken) {
        getMyPrintingRequests(s.accessToken)
          .then((data) => setRequests(data))
          .catch((err) => console.error("Error loading requests:", err))
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });
  }, [router]);

  const formatBDT = (amount: number) =>
    `৳${new Intl.NumberFormat("en-BD").format(amount)}`;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return <span style={{ padding: "4px 8px", background: "#fef3c7", color: "#92400e", borderRadius: "3px", fontSize: "11px", fontWeight: 700 }}>SUBMITTED · REVIEWING</span>;
      case "QUOTED":
        return <span style={{ padding: "4px 8px", background: "#dbeafe", color: "#1e40af", borderRadius: "3px", fontSize: "11px", fontWeight: 700 }}>QUOTATION READY · ACTION NEEDED</span>;
      case "QUOTATION_ACCEPTED":
      case "IN_PRODUCTION":
        return <span style={{ padding: "4px 8px", background: "#f3e8ff", color: "#6b21a8", borderRadius: "3px", fontSize: "11px", fontWeight: 700 }}>IN PRODUCTION</span>;
      case "COMPLETED":
        return <span style={{ padding: "4px 8px", background: "#dcfce7", color: "#166534", borderRadius: "3px", fontSize: "11px", fontWeight: 700 }}>COMPLETED & SHIPPED</span>;
      case "CANCELLED":
      case "QUOTATION_REJECTED":
        return <span style={{ padding: "4px 8px", background: "#fee2e2", color: "#991b1b", borderRadius: "3px", fontSize: "11px", fontWeight: 700 }}>CLOSED</span>;
      default:
        return <span style={{ padding: "4px 8px", background: "#f3f4f6", color: "#374151", borderRadius: "3px", fontSize: "11px", fontWeight: 700 }}>{status}</span>;
    }
  };

  return (
    <Container className="page-content" style={{ maxWidth: "960px", margin: "40px auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "32px", borderBottom: "1px solid var(--border)", paddingBottom: "20px" }}>
        <div>
          <p className="eyebrow" style={{ letterSpacing: "0.15em", marginBottom: "6px" }}>
            AUTHENTIC COMMISSIONS / COLLECTOR WORKBENCH
          </p>
          <h1 style={{ fontSize: "32px", fontWeight: 900, margin: 0, textTransform: "uppercase" }}>
            MY 3D PRINTING REQUESTS
          </h1>
        </div>
        <Link
          href="/3d-printing#quotation"
          className="button button--primary"
          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <Plus size={16} /> NEW COMMISSION
        </Link>
      </div>

      {loading ? (
        <div style={{ padding: "60px 0", textAlign: "center" }}>
          <p style={{ fontWeight: 700 }}>LOADING COMMISSIONS & QUOTATIONS…</p>
        </div>
      ) : requests.length === 0 ? (
        <div
          style={{
            border: "1px dashed var(--border)",
            padding: "64px 24px",
            textAlign: "center",
            borderRadius: "4px",
            background: "#fafafa",
          }}
        >
          <Printer size={48} style={{ margin: "0 auto 16px", color: "var(--muted)" }} />
          <h2 style={{ fontSize: "20px", fontWeight: 800, margin: "0 0 8px" }}>
            NO CUSTOM FIGURE REQUESTS YET
          </h2>
          <p style={{ color: "var(--muted)", fontSize: "14px", maxWidth: "440px", margin: "0 auto 24px" }}>
            Bring your favorite anime characters or impossible dream figures to reality using our bespoke 8K resin printing and master hand-painting service.
          </p>
          <Link href="/3d-printing#quotation" className="button button--primary">
            REQUEST YOUR FIRST 3D FIGURE
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {requests.map((req) => {
            const hasPendingQuote = req.quotations?.some((q) => q.status === "PENDING");
            const activeQuote = req.activeQuotation || req.quotations?.[0];

            return (
              <div
                key={req.id}
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: "4px",
                  padding: "24px",
                  background: "var(--card-bg, #ffffff)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "16px",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                    <code style={{ fontSize: "13px", fontWeight: 700 }}>{req.requestNumber}</code>
                    {getStatusBadge(req.status)}
                  </div>
                  <h3 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 4px" }}>
                    {req.title}
                  </h3>
                  <p style={{ color: "var(--muted)", fontSize: "13px", margin: "0 0 8px" }}>
                    {req.characterName} · {req.animeName} · Scale: {req.sizePreference || "Standard"}
                  </p>
                  {activeQuote && (
                    <div style={{ fontSize: "13px", display: "flex", gap: "16px", color: "var(--text)" }}>
                      <span>
                        Total Quote: <strong>{formatBDT(activeQuote.totalAmount)}</strong>
                      </span>
                      <span>
                        Required Deposit (50%): <strong>{formatBDT(activeQuote.depositAmount)}</strong>
                      </span>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Link
                    href={`/account/printing-requests/${req.id}`}
                    className={hasPendingQuote ? "button button--primary" : "button button--secondary"}
                    style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                  >
                    {hasPendingQuote ? "REVIEW QUOTATION" : "TRACK PROGRESS"}
                    <ChevronRight size={16} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Container>
  );
}

