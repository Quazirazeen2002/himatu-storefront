"use client";

import { postAnalyticsEvent } from "./commerce-api";
import type { CreateAnalyticsEventDto } from "@himatu/shared";

function getSessionId(): string {
  if (typeof window === "undefined") return "server-session";
  try {
    let sid = sessionStorage.getItem("himatu_sid");
    if (!sid) {
      sid = "sid_" + Math.random().toString(36).substring(2, 15) + "_" + Date.now();
      sessionStorage.setItem("himatu_sid", sid);
    }
    return sid;
  } catch {
    return "fallback-sid-" + Date.now();
  }
}

export function initStorefrontSession(userId?: string) {
  if (typeof window === "undefined") return;
  try {
    const initialized = sessionStorage.getItem("himatu_session_initialized");
    if (!initialized) {
      sessionStorage.setItem("himatu_session_initialized", "true");
      postAnalyticsEvent({
        eventName: "storefront_session_started",
        sessionId: getSessionId(),
        userId,
        metadata: {
          userAgent: navigator.userAgent.slice(0, 100),
          referrer: document.referrer || "direct",
        },
      }).catch(() => {});
    }
  } catch {}
}

export function trackProductView(productId: string, categoryId?: string, metadata?: Record<string, any>) {
  if (typeof window === "undefined") return;
  try {
    postAnalyticsEvent({
      eventName: "product_viewed",
      sessionId: getSessionId(),
      productId,
      categoryId,
      metadata,
    }).catch(() => {});
  } catch {}
}

export function trackAddToCart(productId: string, quantity = 1, metadata?: Record<string, any>) {
  if (typeof window === "undefined") return;
  try {
    postAnalyticsEvent({
      eventName: "add_to_cart",
      sessionId: getSessionId(),
      productId,
      metadata: { quantity, ...metadata },
    }).catch(() => {});
  } catch {}
}

export function trackCheckoutStarted(itemCount: number, totalAmount: number) {
  if (typeof window === "undefined") return;
  try {
    postAnalyticsEvent({
      eventName: "checkout_started",
      sessionId: getSessionId(),
      metadata: { itemCount, totalAmount },
    }).catch(() => {});
  } catch {}
}

export function trackPurchaseCompleted(orderNumber: string, totalAmount: number) {
  if (typeof window === "undefined") return;
  try {
    postAnalyticsEvent({
      eventName: "purchase_completed",
      sessionId: getSessionId(),
      metadata: { orderNumber, totalAmount },
    }).catch(() => {});
  } catch {}
}

