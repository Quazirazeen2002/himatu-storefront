"use client";

import { useState, useEffect, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  User,
  LogOut,
  Package,
  Heart,
  ShieldCheck,
  ArrowUpRight,
} from "lucide-react";
import { authService, type CustomerSession } from "@/lib/auth-service";
import { useStore } from "../commerce/StoreProvider";

const emptySubscribe = () => () => {};

function getInitials(name: string, email: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return "H";
}

export function ProfileMenu() {
  const [session, setSession] = useState<CustomerSession | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const store = useStore();

  const loadSession = () => {
    authService
      .getSession()
      .then((data) => setSession(data))
      .catch(() => setSession(null));
  };

  useEffect(() => {
    loadSession();

    const handleAuthChange = () => {
      loadSession();
    };

    window.addEventListener("himatu:auth-change", handleAuthChange);
    return () => {
      window.removeEventListener("himatu:auth-change", handleAuthChange);
    };
  }, [pathname]);

  // Click outside and escape key handling
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await authService.signOut();
      setSession(null);
      setIsOpen(false);
      router.push("/sign-in");
      router.refresh();
    } catch {
      // Clean fallback
      router.push("/sign-in");
    } finally {
      setIsSigningOut(false);
    }
  };

  if (!isMounted) {
    // Avoid hydration mismatch
    return (
      <Link
        href="/sign-in"
        className="profile-auth-pill"
        aria-label="Sign in"
      >
        <User size={16} />
      </Link>
    );
  }

  // When signed out
  if (!session) {
    const signInHref =
      pathname && pathname !== "/sign-in" && pathname !== "/create-account"
        ? `/sign-in?next=${encodeURIComponent(pathname)}`
        : "/sign-in";

    return (
      <Link
        href={signInHref}
        className="profile-auth-pill"
        aria-label="Sign in to your HIMATU account"
      >
        <User size={16} />
      </Link>
    );
  }

  // When signed in
  const initials = getInitials(session.user.fullName, session.user.email);
  const wishlistCount = store.wishlist.length;

  return (
    <div className="profile-widget" ref={containerRef}>
      <button
        type="button"
        className={`profile-avatar-trigger ${isOpen ? "active" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={`Account menu for ${session.user.fullName || "customer"}`}
      >
        <User size={20} aria-hidden="true" />
        <span className="profile-initials" aria-hidden="true">{initials}</span>
      </button>

      {isOpen && (
        <div className="profile-flyout" role="menu">
          {/* Header Card */}
          <div className="profile-flyout-header">
            <div className="profile-flyout-badge-row">
              <span className="profile-flyout-avatar">{initials}</span>
              <div className="profile-flyout-details">
                <p className="profile-flyout-name">
                  {session.user.fullName || "Collector"}
                </p>
                <p className="profile-flyout-email">{session.user.email}</p>
              </div>
            </div>
            <div className="profile-verified-tag">
              <ShieldCheck size={13} />
              <span>{session.user.role === "ADMIN" ? "ADMINISTRATOR" : "VERIFIED MEMBER"}</span>
            </div>
          </div>

          <div className="profile-flyout-divider" />

          {/* Navigation Links */}
          <nav className="profile-flyout-nav">
            {session.user.role === "ADMIN" && (
              <>
                <Link
                  href="/admin"
                  className="profile-flyout-link"
                  onClick={() => setIsOpen(false)}
                >
                  <ShieldCheck size={16} />
                  <div className="profile-flyout-link-text">
                    <strong style={{ color: "var(--accent)" }}>Admin Dashboard</strong>
                    <small>Control center, analytics & sales</small>
                  </div>
                  <ArrowUpRight size={14} className="profile-flyout-arrow" />
                </Link>
                <Link
                  href="/admin/products"
                  className="profile-flyout-link"
                  onClick={() => setIsOpen(false)}
                >
                  <Package size={16} />
                  <div className="profile-flyout-link-text">
                    <strong>Product Management</strong>
                    <small>Catalogue, inventory & storage</small>
                  </div>
                  <ArrowUpRight size={14} className="profile-flyout-arrow" />
                </Link>
              </>
            )}

            <Link
              href="/account"
              className="profile-flyout-link"
              onClick={() => setIsOpen(false)}
            >
              <User size={16} />
              <div className="profile-flyout-link-text">
                <strong>Profile & Details</strong>
                <small>Shipping address & contact</small>
              </div>
              <ArrowUpRight size={14} className="profile-flyout-arrow" />
            </Link>

            <Link
              href="/account/orders"
              className="profile-flyout-link"
              onClick={() => setIsOpen(false)}
            >
              <Package size={16} />
              <div className="profile-flyout-link-text">
                <strong>My Collection Orders</strong>
                <small>Track packages & history</small>
              </div>
              <ArrowUpRight size={14} className="profile-flyout-arrow" />
            </Link>

            <Link
              href="/wishlist"
              className="profile-flyout-link"
              onClick={() => setIsOpen(false)}
            >
              <Heart size={16} />
              <div className="profile-flyout-link-text">
                <strong>Saved Figures</strong>
                <small>Your personal wishlist</small>
              </div>
              {wishlistCount > 0 && (
                <span className="profile-flyout-counter">{wishlistCount}</span>
              )}
            </Link>
          </nav>

          <div className="profile-flyout-divider" />

          {/* Sign Out Button */}
          <div className="profile-flyout-footer">
            <button
              type="button"
              className="profile-flyout-signout"
              onClick={handleSignOut}
              disabled={isSigningOut}
            >
              <LogOut size={15} />
              <span>{isSigningOut ? "SIGNING OUT…" : "SIGN OUT"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
