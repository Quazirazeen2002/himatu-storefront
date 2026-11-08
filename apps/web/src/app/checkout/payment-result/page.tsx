"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Receipt,
  RotateCcw,
} from "lucide-react";
import { getTransaction } from "@/lib/commerce-api";
import type { PaymentTransactionDto } from "@himatu/shared";
import { Container } from "@/components/ui/Primitives";

function PaymentResultContent() {
  const searchParams = useSearchParams();
  const provider = searchParams.get("provider") || "GATEWAY";
  const trxRef = searchParams.get("trxRef") || "";
  const orderNumber = searchParams.get("orderNumber") || "";
  const statusParam = searchParams.get("status") || "PENDING";

  const [loading, setLoading] = useState(Boolean(trxRef));
  const [transaction, setTransaction] = useState<PaymentTransactionDto | null>(null);

  useEffect(() => {
    if (!trxRef) {
      setLoading(false);
      return;
    }

    getTransaction(trxRef)
      .then((txn) => {
        setTransaction(txn);
      })
      .catch((err) => {
        console.error("Failed to load transaction:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [trxRef]);

  const effectiveStatus = transaction?.status || (statusParam === "VALID" ? "PAID" : statusParam);
  const isPaid = effectiveStatus === "PAID";
  const isFailed = effectiveStatus === "FAILED" || effectiveStatus === "CANCELLED";

  const formatBDT = (amount: number) =>
    `৳${new Intl.NumberFormat("en-BD").format(amount)}`;

  return (
    <Container className="page-content" style={{ maxWidth: "720px", margin: "40px auto" }}>
      <div
        style={{
          border: "1px solid var(--border)",
          background: "var(--card-bg, #ffffff)",
          padding: "48px 32px",
          textAlign: "center",
          borderRadius: "4px",
        }}
      >
        {isPaid ? (
          <div style={{ color: "#16a34a", marginBottom: "20px" }}>
            <CheckCircle2 size={56} style={{ margin: "0 auto" }} />
          </div>
        ) : isFailed ? (
          <div style={{ color: "#dc2626", marginBottom: "20px" }}>
            <XCircle size={56} style={{ margin: "0 auto" }} />
          </div>
        ) : (
          <div style={{ color: "#d97706", marginBottom: "20px" }}>
            <Clock size={56} style={{ margin: "0 auto" }} />
          </div>
        )}

        <p className="eyebrow" style={{ letterSpacing: "0.15em", marginBottom: "8px" }}>
          {provider.toUpperCase()} CHECKOUT VERIFICATION
        </p>

        <h1 style={{ fontSize: "28px", fontWeight: 900, margin: "0 0 12px", textTransform: "uppercase" }}>
          {isPaid
            ? "PAYMENT CONFIRMED"
            : isFailed
              ? "PAYMENT DECLINED OR CANCELLED"
              : "PAYMENT PROCESSING"}
        </h1>

        <p style={{ color: "var(--muted)", fontSize: "15px", maxWidth: "480px", margin: "0 auto 32px" }}>
          {isPaid
            ? "Your payment was verified server-to-server. Your Japanese anime collectible order has been locked and queued for vault dispatch."
            : isFailed
              ? "The transaction could not be completed by the payment provider. No funds were debited, or a reversal is in progress."
              : "We are confirming your payment settlement with the bank. Check back in a few moments."}
        </p>

        {/* Transaction Receipt Box */}
        <div
          style={{
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            padding: "20px",
            textAlign: "left",
            fontSize: "14px",
            marginBottom: "32px",
            borderRadius: "4px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f3f4f6" }}>
            <span style={{ color: "#6b7280" }}>Order Number</span>
            <strong>{orderNumber || transaction?.orderNumber || "—"}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f3f4f6" }}>
            <span style={{ color: "#6b7280" }}>Transaction Ref</span>
            <code style={{ fontSize: "13px" }}>{trxRef || transaction?.transactionRef || "—"}</code>
          </div>
          {transaction?.providerTransactionId && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f3f4f6" }}>
              <span style={{ color: "#6b7280" }}>Gateway TrxID</span>
              <code style={{ fontSize: "13px" }}>{transaction.providerTransactionId}</code>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f3f4f6" }}>
            <span style={{ color: "#6b7280" }}>Provider</span>
            <strong>{provider.toUpperCase()}</strong>
          </div>
          {transaction?.amount ? (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f3f4f6" }}>
              <span style={{ color: "#6b7280" }}>Amount Paid</span>
              <strong style={{ fontSize: "16px" }}>{formatBDT(transaction.amount)}</strong>
            </div>
          ) : null}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
            <span style={{ color: "#6b7280" }}>Status</span>
            <strong
              style={{
                color: isPaid ? "#16a34a" : isFailed ? "#dc2626" : "#d97706",
                textTransform: "uppercase",
              }}
            >
              {effectiveStatus}
            </strong>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          {isPaid ? (
            <>
              <Link
                href="/account/orders"
                className="button button--primary"
                style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
              >
                VIEW ORDER HISTORY <ArrowRight size={16} />
              </Link>
              <Link href="/shop" className="button button--secondary">
                EXPLORE MORE FIGURES
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/checkout"
                className="button button--primary"
                style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
              >
                <RotateCcw size={16} /> RETRY PAYMENT
              </Link>
              <Link href="/shop" className="button button--secondary">
                RETURN TO SHOP
              </Link>
            </>
          )}
        </div>
      </div>
    </Container>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense
      fallback={
        <Container className="page-content" style={{ padding: "80px 20px", textAlign: "center" }}>
          <p style={{ fontWeight: 700 }}>VERIFYING PAYMENT SETTLEMENT…</p>
        </Container>
      }
    >
      <PaymentResultContent />
    </Suspense>
  );
}

