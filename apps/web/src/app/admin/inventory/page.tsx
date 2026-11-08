import { InventoryManagement } from "@/components/admin/InventoryManagement";

export const metadata = {
  title: "Inventory Control · HIMATU Admin",
  description: "Monitor stock quantities, warehouse levels, and low-stock alerts.",
};

export default function AdminInventoryPage() {
  return <InventoryManagement />;
}

