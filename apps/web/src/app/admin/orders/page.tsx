import { Suspense } from "react";
import { OrderManagement } from "@/components/admin/OrderManagement";

export const metadata = {
  title: "Orders & Fulfillment · HIMATU Admin",
  description: "Manage customer orders, Cash on Delivery verification, and courier dispatches.",
};

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<p style={{ padding: "40px" }}>Loading orders…</p>}>
      <OrderManagement />
    </Suspense>
  );
}

