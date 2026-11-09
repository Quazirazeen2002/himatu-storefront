import { CategoryManagement } from "@/components/admin/CategoryManagement";

export const metadata = {
  title: "Categories · HIMATU Admin",
  description: "Manage product categories, franchises, collection families and their cover images.",
};

export default function AdminCategoriesPage() {
  return <CategoryManagement />;
}

