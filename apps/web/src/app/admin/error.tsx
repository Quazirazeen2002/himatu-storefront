"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin workspace caught error:", error);
  }, [error]);

  return (
    <div
      style={{
        padding: "40px",
        maxWidth: "640px",
        margin: "60px auto",
        background: "var(--admin-surface, #ffffff)",
        borderRadius: "8px",
        border: "1px solid var(--admin-border, #e5e7eb)",
        textAlign: "center",
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
      }}
    >
      <AlertCircle
        size={44}
        style={{ color: "var(--admin-danger, #b42323)", margin: "0 auto 16px" }}
      />
      <h2
        style={{
          fontSize: "18px",
          fontWeight: 800,
          marginBottom: "8px",
          color: "var(--admin-text, #111111)",
        }}
      >
        Admin Workspace Encountered An Issue
      </h2>
      <p
        style={{
          fontSize: "13px",
          color: "var(--admin-muted, #6b7280)",
          marginBottom: "20px",
          lineHeight: "1.5",
        }}
      >
        {error.message ||
          "An unexpected error occurred while loading this administrative view."}
      </p>
      <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
        <button
          type="button"
          onClick={() => reset()}
          className="admin-btn admin-btn--primary"
        >
          <RefreshCw size={14} />
          <span>Reload View</span>
        </button>
        <Link href="/admin" className="admin-btn admin-btn--secondary">
          Back to Overview
        </Link>
      </div>
    </div>
  );
}

