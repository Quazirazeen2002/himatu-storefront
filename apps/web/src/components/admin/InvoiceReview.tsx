"use client";
import { useState } from "react";
import { commerceRequest } from "@/lib/commerce-api";
export function InvoiceReview({
  orderId,
  token,
}: {
  orderId: string;
  token: string;
}) {
  const [invoice, setInvoice] = useState<{
      html: string;
      sentAt?: string;
    } | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <section className="admin-card">
      <h3>Customer invoice</h3>
      {error && (
        <p role="alert" className="staff-error">
          {error}
        </p>
      )}
      {error.includes("delivery") && (
        <button
        type="button"
          className="admin-btn admin-btn--secondary"
          onClick={async () => {
            if (
              !window.confirm(
                "Have you checked the sender delivery log and confirmed that this invoice was NOT delivered?",
              )
            )
              return;
            try {
              await commerceRequest(`/admin/invoices/${orderId}/unlock`, {
                method: "POST",
                token,
                body: JSON.stringify({ deliveryChecked: true }),
              });
              setError("Retry unlocked. Prepare and review the invoice again.");
            } catch (e) {
              setError(e instanceof Error ? e.message : "Unlock failed");
            }
          }}
        >
          Sender log checked: allow retry
        </button>
      )}
      <button
        type="button"
        className="admin-btn admin-btn--secondary"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            setInvoice(
              await commerceRequest(`/admin/invoices/${orderId}/review`, {
                method: "POST",
                token,
              }),
            );
            setError("");
          } catch (e) {
            setError(e instanceof Error ? e.message : "Review failed");
          } finally {
            setBusy(false);
          }
        }}
      >
        Prepare invoice for review
      </button>
      {invoice && (
        <>
          <iframe
            title="Customer invoice preview"
            sandbox=""
            srcDoc={invoice.html}
            style={{
              width: "100%",
              height: 600,
              marginBlock: 16,
              border: "1px solid #ddd",
            }}
          />
          <button
        type="button"
            disabled={busy || !!invoice.sentAt}
            className="admin-btn admin-btn--primary"
            onClick={async () => {
              setBusy(true);
              try {
                await commerceRequest(`/admin/invoices/${orderId}/send`, {
                  method: "POST",
                  token,
                });
                setInvoice({ ...invoice, sentAt: new Date().toISOString() });
              } catch (e) {
                setError(e instanceof Error ? e.message : "Email failed");
              } finally {
                setBusy(false);
              }
            }}
          >
            {invoice.sentAt
              ? "Invoice emailed"
              : "Approve & email invoice to customer"}
          </button>
        </>
      )}
    </section>
  );
}
