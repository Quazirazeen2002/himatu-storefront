"use client";
import { inactiveAdminModule } from "@/lib/admin-modules";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Layers,
  Image as ImageIcon,
  Boxes,
  ShoppingBag,
  CreditCard,
  Users,
  Printer,
  Settings,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  LogOut,
  Menu,
  X,
  Calendar,
  ShieldCheck,
  Search,
  Bell,
  TrendingUp,
} from "lucide-react";
import { authService, type CustomerSession } from "@/lib/auth-service";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number }>;
  group: "OVERVIEW" | "CATALOGUE" | "SALES" | "CUSTOMERS" | "SETTINGS";
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Social Order Inbox",
    href: "/admin/social-orders",
    icon: ShoppingBag,
    group: "SALES",
  },
  {
    label: "Homepage Slides",
    href: "/admin/content",
    icon: ImageIcon,
    group: "SETTINGS",
  },
  {
    label: "Staff Roles",
    href: "/admin/staff",
    icon: ShieldCheck,
    group: "SETTINGS",
  },
  {
    label: "Overview",
    href: "/admin",
    icon: LayoutDashboard,
    group: "OVERVIEW",
  },
  {
    label: "Analytics & Insights",
    href: "/admin/analytics",
    icon: TrendingUp,
    group: "OVERVIEW",
  },
  {
    label: "Products",
    href: "/admin/products",
    icon: Package,
    group: "CATALOGUE",
  },
  {
    label: "Categories",
    href: "/admin/categories",
    icon: Layers,
    group: "CATALOGUE",
  },
  {
    label: "Inventory",
    href: "/admin/inventory",
    icon: Boxes,
    group: "CATALOGUE",
  },
  { label: "Orders", href: "/admin/orders", icon: ShoppingBag, group: "SALES" },
  {
    label: "Payments",
    href: "/admin/payments",
    icon: CreditCard,
    group: "SALES",
  },
  {
    label: "Customers",
    href: "/admin/customers",
    icon: Users,
    group: "CUSTOMERS",
  },
  {
    label: "Custom 3D Printing",
    href: "/admin/3d-printing",
    icon: Printer,
    group: "CUSTOMERS",
  },
  {
    label: "Production Kanban",
    href: "/admin/3d-printing/production",
    icon: Layers,
    group: "CUSTOMERS",
  },
  {
    label: "Store Settings",
    href: "/admin/settings",
    icon: Settings,
    group: "SETTINGS",
  },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<CustomerSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Load sidebar preference from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("himatu-admin-collapsed");
      if (saved === "1") setIsCollapsed(true);
    } catch {}
  }, []);

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("himatu-admin-collapsed", next ? "1" : "0");
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    let active = true;
    authService
      .getSession()
      .then((s) => {
        if (!active) return;
        setSession(s);
        if (!s || !["ADMIN", "MODERATOR"].includes(s.user.role)) {
          router.push("/sign-in?next=/admin");
        }
      })
      .catch(() => {
        if (active) router.push("/sign-in?next=/admin");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [router]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "#f8f9fa",
          color: "#111111",
          fontFamily: "var(--font-ui)",
        }}
      >
        <p
          style={{ fontWeight: 700, fontSize: "14px", letterSpacing: "0.04em" }}
        >
          VERIFYING STORE OWNER PRIVILEGES…
        </p>
      </div>
    );
  }

  if (!session || !session.user || !["ADMIN", "MODERATOR"].includes(session.user.role)) {
    return null;
  }

  const dateDhakaStr = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dhaka",
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  const permittedPaths = [
    "/admin/products",
    "/admin/categories",
    "/admin/inventory",
    "/admin/orders",
    "/admin/social-orders",
  ];
  if (
    session.user?.role === "MODERATOR" &&
    !permittedPaths.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`),
    )
  )
    return (
      <div className="admin-card">
        <h1>Administrator access required</h1>
        <Link href="/admin/social-orders">Open order inbox</Link>
      </div>
    );
  const inactiveModule = inactiveAdminModule(pathname);
  const currentNav =
    NAV_ITEMS.find(
      (item) =>
        item.href === pathname ||
        (item.href !== "/admin" && pathname?.startsWith(item.href)),
    ) || NAV_ITEMS[0];

  const groups = [
    "OVERVIEW",
    "CATALOGUE",
    "SALES",
    "CUSTOMERS",
    "SETTINGS",
  ] as const;

  return (
    <div className={`admin-shell ${isCollapsed ? "is-collapsed" : ""}`}>
      {/* 1. Dark Luxury Sidebar */}
      <aside
        className={`admin-sidebar ${isCollapsed ? "is-collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}
      >
        <div className="admin-sidebar-header">
          <Link
            href="/admin"
            className="admin-wordmark"
            title="HIMATU Owner Control Center"
          >
            <span className="admin-wordmark-title">HIMATU</span>
            {!isCollapsed && (
              <span className="admin-owner-tag">{session.user?.role || "ADMIN"}</span>
            )}
          </Link>
          <button
            type="button"
            className="admin-mobile-menu-btn"
            style={{ color: "#ffffff", display: mobileOpen ? "block" : "none" }}
            onClick={() => setMobileOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="admin-sidebar-nav" aria-label="Admin Navigation">
          {groups.map((group) => {
            const items = NAV_ITEMS.filter((i) => i.group === group);
            return (
              <div key={group} className="admin-nav-group">
                <span className="admin-nav-group-title">{group}</span>
                {items
                  .filter(
                    (item) =>
                      session.user?.role === "ADMIN" ||
                      permittedPaths.includes(item.href),
                  )
                  .map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      item.href === "/admin"
                        ? pathname === "/admin"
                        : pathname?.startsWith(item.href);

                    if (inactiveAdminModule(item.href))
                      return (
                        <div
                          key={item.href}
                          className="admin-nav-link admin-nav-link--unavailable"
                          aria-disabled="true"
                          title={`${item.label}: Out of order`}
                        >
                          <Icon size={18} />
                          <span className="admin-nav-label">
                            {item.label}
                            <small className="admin-module-status">
                              Out of order
                            </small>
                          </span>
                        </div>
                      );
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`admin-nav-link ${isActive ? "is-active" : ""}`}
                        title={isCollapsed ? item.label : undefined}
                      >
                        <Icon size={18} />
                        <span className="admin-nav-label">{item.label}</span>
                      </Link>
                    );
                  })}
              </div>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <button
            type="button"
            className="admin-btn-toggle-sidebar"
            onClick={toggleCollapsed}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight size={16} />
            ) : (
              <ChevronLeft size={16} />
            )}
            <span>{isCollapsed ? "Expand" : "Collapse Navigation"}</span>
          </button>

          <Link
            href="/"
            className="admin-nav-link"
            style={{ color: "#a3a3a3", fontSize: "12px" }}
            target="_blank"
            title="View Storefront"
          >
            <ExternalLink size={16} />
            <span className="admin-nav-label">View Storefront</span>
          </Link>
        </div>
      </aside>

      {/* 2. Main Area */}
      <div className="admin-main">
        {/* Top Header */}
        <header className="admin-header">
          <div className="admin-header-left">
            <button
              type="button"
              className="admin-mobile-menu-btn"
              onClick={() => setMobileOpen(true)}
              aria-label="Open mobile navigation"
            >
              <Menu size={20} />
            </button>

            <div className="admin-breadcrumbs">
              <span>HIMATU Admin</span>
              <span>/</span>
              <span>{currentNav?.label || "Overview"}</span>
            </div>
          </div>

          <div className="admin-header-right">
            <div className="admin-header-date-pill">
              <Calendar size={13} />
              <span>{dateDhakaStr} (BST)</span>
            </div>

            <Link href="/" className="admin-header-btn-store" target="_blank">
              <span>View Store</span>
              <ExternalLink size={12} />
            </Link>

            <div className="admin-header-user">
              <div className="admin-user-avatar" title={session.user?.fullName || "Admin"}>
                {session.user?.fullName
                  ? session.user.fullName.slice(0, 2).toUpperCase()
                  : "AD"}
              </div>
              <button
                type="button"
                className="admin-btn-toggle-sidebar"
                style={{ padding: "4px", color: "var(--admin-muted)" }}
                onClick={async () => {
                  await authService.signOut();
                  router.push("/sign-in");
                }}
                title="Sign out of Admin"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>

        {/* Workspace Content */}
        <main className="admin-content">
          {inactiveModule ? (
            <section
              className="admin-card admin-unavailable-state"
              role="status"
            >
              <h1>{inactiveModule.label}</h1>
              <p className="admin-unavailable-label">Out of order</p>
              <p>{inactiveModule.reason}</p>
              <Link
                className="admin-btn admin-btn--secondary"
                href="/admin/orders"
              >
                Open Orders
              </Link>
            </section>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
