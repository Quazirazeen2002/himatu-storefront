import "./admin.css";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminBoundary } from "@/components/admin/AdminBoundary";

export const metadata = {
  title: "Store Owner Control Center · HIMATU Admin",
  description: "Shopify × Vercel hybrid management console for HIMATU anime collectibles.",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminBoundary>
      <AdminShell>{children}</AdminShell>
    </AdminBoundary>
  );
}
