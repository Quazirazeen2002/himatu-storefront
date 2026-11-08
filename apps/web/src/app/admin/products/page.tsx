import { ProductManagement } from "@/components/admin/ProductManagement";

export const metadata = {
  title: "Product Catalogue · HIMATU Admin",
  description: "Curate authentic anime figure catalogue, manage inventory, and upload photographs.",
};

export default function AdminProductsPage() {
  return <ProductManagement />;
}
