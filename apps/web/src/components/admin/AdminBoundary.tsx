"use client";

import React, { Component, type ReactNode } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AdminBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("AdminBoundary caught unhandled admin workspace error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "48px 32px",
            maxWidth: "680px",
            margin: "80px auto",
            background: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            textAlign: "center",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.08)",
            fontFamily: "var(--font-ui, system-ui, sans-serif)",
          }}
        >
          <AlertCircle
            size={48}
            style={{ color: "#dc2626", margin: "0 auto 16px" }}
          />
          <h1
            style={{
              fontSize: "20px",
              fontWeight: 800,
              marginBottom: "8px",
              color: "#111827",
            }}
          >
            Admin Workspace Needs Attention
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "#4b5563",
              marginBottom: "20px",
              lineHeight: "1.6",
            }}
          >
            {this.state.error?.message ||
              "An unexpected issue occurred while rendering this administrative section."}
          </p>
          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "center",
              marginTop: "24px",
            }}
          >
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                background: "#080808",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <RefreshCw size={14} />
              <span>Reload Workspace</span>
            </button>
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "10px 20px",
                background: "#f3f4f6",
                color: "#1f2937",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Storefront Home
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
