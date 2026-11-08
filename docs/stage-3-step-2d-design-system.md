# HIMATU Admin Dashboard — Design System Specification
## Stage 3 Step 2D: Shopify × Vercel Hybrid Design Language

---

## 1. Design Philosophy

The HIMATU Admin Dashboard design system synthesizes three complementary design disciplines:
1. **Shopify Admin Operational Usability**: Structured persistent sidebar, clear information hierarchy, high-density yet readable data tables, practical operational metrics, contextual actions, and accessible status indicators.
2. **Vercel Control Center Precision**: Minimalist layouts, crisp 1px borders (`#E5E7EB` / `#E7E7E7`), restrained neutral surfaces, refined dark accents, clean spacing, and modern typography hierarchy.
3. **HIMATU Brand Identity**: Bold Nike-inspired uppercase display typography, high-contrast dark primary navigation `#111111`, and restrained crimson accents (`#D92727` / `#EF4444`) for high-intent actions and live operational badges.

---

## 2. Color Palette & CSS Tokens

The design tokens are declared in `apps/web/src/app/admin/admin.css` and applied across all `/admin/*` views.

| Token | Variable | Value | Usage |
| :--- | :--- | :--- | :--- |
| **Workspace Background** | `--admin-bg` | `#F8F9FA` (`#F7F7F7`) | Canvas background for all management pages |
| **Surface Card** | `--admin-surface` | `#FFFFFF` | Card backgrounds, tables, modal dialogs, flyouts |
| **Border Subtle** | `--admin-border` | `#E5E7EB` (`#E7E7E7`) | 1px dividers, card outlines, table row borders |
| **Text Primary** | `--admin-text-primary` | `#111111` | Metric figures, table values, headings |
| **Text Secondary** | `--admin-text-secondary` | `#6B7280` (`#717171`) | Labels, captions, breadcrumbs, helper notes |
| **Text Tertiary** | `--admin-text-tertiary` | `#9CA3AF` | Empty state text, placeholder text, disabled icons |
| **Primary Sidebar** | `--admin-sidebar-bg` | `#111111` | Persistent left navigation panel |
| **Sidebar Surface** | `--admin-sidebar-surface` | `#1A1A1A` | Profile pill, quick-action tiles, search bar in sidebar |
| **Sidebar Border** | `--admin-sidebar-border` | `#262626` | Sidebar dividers and section borders |
| **Sidebar Text Active** | `--admin-sidebar-text-active` | `#FFFFFF` | Active tab label and iconography |
| **Sidebar Text Inactive** | `--admin-sidebar-text-inactive`| `#9CA3AF` | Inactive tab labels (hover: `#E5E7EB`) |
| **Brand Accent Red** | `--admin-accent` | `#D92727` | Primary buttons, brand badge, live indicators |
| **Brand Accent Hover** | `--admin-accent-hover` | `#B91C1C` | Hover state for accent buttons |
| **Success Muted** | `--admin-success` | `#10B981` | Delivered badge, stock in-bounds, positive velocity |
| **Success Surface** | `--admin-success-surface` | `#ECFDF5` | Green badge background fill |
| **Warning Amber** | `--admin-warning` | `#F59E0B` | Low stock alert (<= 5), COD pending collection |
| **Warning Surface** | `--admin-warning-surface` | `#FFFBEB` | Amber badge background fill |
| **Danger / Alert** | `--admin-danger` | `#EF4444` | Out of stock, cancelled orders, delete actions |
| **Danger Surface** | `--admin-danger-surface` | `#FEF2F2` | Red badge background fill |
| **Neutral Badge Fill** | `--admin-badge-neutral-bg` | `#F3F4F6` | Drafts, archived records, standard tags |
| **Neutral Badge Text** | `--admin-badge-neutral-text`| `#374151` | Neutral badge font color |

---

## 3. Typography Scale & Hierarchy

| Element | Font Size | Line Height | Weight | Letter Spacing | CSS Equivalent |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Page Title** | 24px (1.5rem) | 32px | 700 (Bold) | -0.025em | `text-2xl font-bold tracking-tight text-neutral-900` |
| **Section Header** | 18px (1.125rem) | 28px | 600 (Semibold)| -0.015em | `text-lg font-semibold tracking-tight text-neutral-900` |
| **Card / Modal Title**| 15px (0.9375rem)| 22px | 600 (Semibold)| 0 | `text-sm font-semibold text-neutral-900` |
| **KPI Big Stat** | 30px (1.875rem) | 36px | 800 (Extrabold)| -0.03em | `text-3xl font-extrabold tracking-tight text-neutral-900` |
| **Body Primary** | 14px (0.875rem) | 20px | 400 (Regular) | 0 | `text-sm font-normal text-neutral-800` |
| **Body Medium** | 14px (0.875rem) | 20px | 500 (Medium) | 0 | `text-sm font-medium text-neutral-900` |
| **Secondary / Meta** | 12px (0.75rem) | 16px | 500 (Medium) | +0.01em | `text-xs font-medium text-neutral-500` |
| **Micro / Overline** | 11px (0.6875rem)| 14px | 700 (Bold) | +0.05em | `text-[11px] font-bold uppercase tracking-wider text-neutral-400` |

---

## 4. Spacing, Grid & Layout Rules

### Structural Layout
- **Sidebar Width**: 260px expanded (`w-64`), 72px collapsed (`w-[72px]`).
- **Header Height**: 64px (`h-16`), sticky `top-0 z-30` with backdrop blur (`backdrop-blur-md bg-white/95`).
- **Main Workspace**: Fluid grid with `max-w-7xl mx-auto p-4 md:p-8 space-y-6 md:space-y-8`.
- **Card Padding**: 24px (`p-6`) on desktop, 16px (`p-4`) on mobile.
- **Section Gap**: 24px–32px (`space-y-6` to `space-y-8`).
- **Table Density**: 14px horizontal padding (`px-4` to `px-6`), 12px–14px vertical cell padding (`py-3.5`).

---

## 5. Component Anatomy

### 5.1 KPI Metric Cards
```html
<div class="rounded-xl border border-neutral-200/80 bg-white p-6 shadow-sm">
  <div class="flex items-center justify-between">
    <p class="text-xs font-semibold uppercase tracking-wider text-neutral-500">Total Collected</p>
    <div class="rounded-lg bg-emerald-50 p-2 text-emerald-600">...icon...</div>
  </div>
  <p class="mt-3 text-3xl font-extrabold tracking-tight text-neutral-900">৳142,500</p>
  <div class="mt-2 flex items-center text-xs text-neutral-500">
    <span class="font-medium text-emerald-600">+12%</span>
    <span class="ml-1.5">vs last 30 days</span>
  </div>
</div>
```

### 5.2 Status Badges & Chips
Status pills communicate real-time lifecycle states without cognitive ambiguity:

| Status Code | Badge Background | Badge Text | Icon / Dot |
| :--- | :--- | :--- | :--- |
| `DELIVERED` / `COMPLETED` | `#ECFDF5` (`bg-emerald-50`) | `#065F46` (`text-emerald-700`) | Solid green dot |
| `SHIPPED` / `IN_TRANSIT` | `#EFF6FF` (`bg-blue-50`) | `#1E40AF` (`text-blue-700`) | Shipping icon |
| `CONFIRMED` / `PROCESSING` | `#F5F3FF` (`bg-purple-50`) | `#5B21B6` (`text-purple-700`)| Processing pulse |
| `PENDING` (COD) | `#FFFBEB` (`bg-amber-50`) | `#92400E` (`text-amber-800`)| Clock indicator |
| `CANCELLED` | `#FEF2F2` (`bg-rose-50`) | `#991B1B` (`text-rose-700`)| Cancelled indicator |
| `LOW_STOCK` ($\le 5$) | `#FEF3C7` (`bg-amber-100`) | `#92400E` (`text-amber-900`)| Warning triangle |
| `OUT_OF_STOCK` ($0$) | `#FEE2E2` (`bg-rose-100`) | `#991B1B` (`text-rose-900`)| Out of stock tag |

### 5.3 Data Tables
- Sticky headers with uppercase micro-labels (`text-[11px] font-bold uppercase tracking-wider text-neutral-500`).
- Alternating hover states with subtle `#F9FAFB` highlight.
- Currency formatted with Bangladeshi Taka symbol `৳` and comma-separated thousands (e.g. `৳14,500`).
- Dates formatted in human-readable local time (e.g. `Nov 8, 2026, 11:42 AM`).
- Right-aligned numbers and action columns; left-aligned identifiers and customer names.

### 5.4 Form Standards
- **Input Fields**: 40px height (`py-2.5 px-3.5`), 1px neutral border (`border-neutral-300`), focus ring in `#111111` or `#D92727` (`focus:border-black focus:ring-1 focus:ring-black`).
- **Labels**: 13px medium (`text-xs font-semibold text-neutral-700 uppercase tracking-wide mb-1.5`).
- **Help Text**: 12px secondary (`text-xs text-neutral-500 mt-1`).
- **Primary Action Button**: High-contrast black (`bg-neutral-900 hover:bg-black text-white`) or HIMATU Crimson (`bg-red-600 hover:bg-red-700 text-white`) with rounded-lg geometry and active scale response (`active:scale-[0.98]`).

---

## 6. Responsive Breakpoints

| Breakpoint | Window Width | Layout Behaviors |
| :--- | :--- | :--- |
| **Mobile (`< 768px`)** | `sm: 640px` | Sidebar hidden into off-canvas drawer with backdrop overlay. Tables horizontally scrollable with sticky action columns. KPI grid wraps to single column. |
| **Tablet (`768px - 1024px`)** | `md: 768px` | Sidebar collapsible to compact 72px icon rail. KPI grid transitions to 2-column layout. |
| **Desktop (`1024px - 1280px`)**| `lg: 1024px` | Full 260px expanded sidebar. KPI grid spans 4 equal columns. Tables display full metadata without truncation. |
| **Wide Desktop (`> 1280px`)** | `xl: 1280px` | Generous 32px padding, maximum width bounded at 1440px for comfortable scan paths. |

---

## 7. Accessibility & Ergonomics

1. **Contrast Compliance**: Primary text `#111111` on `#FFFFFF` yields a 16.5:1 contrast ratio (exceeding WCAG AAA 7:1 standard).
2. **Keyboard Navigation**: All interactive elements (search, action buttons, table rows, dropdown triggers) feature accessible `:focus-visible` outlines.
3. **Screen Reader Attributes**: Modals and slide-over panels implement `role="dialog"`, `aria-modal="true"`, and `aria-labelledby`.
4. **State Transitions**: CSS animations are bound to lightweight 150ms–200ms easing curves (`transition: all 0.15s ease-in-out`), respecting reduced-motion preferences.

