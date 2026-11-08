import { CategoryManagement } from "@/components/admin/CategoryManagement";

export const metadata = {
  title: "Categories · HIMATU Admin",
  description: "Manage anime universes, collections, and category hierarchies.",
};

export default function AdminCategoriesPage() {
  return <CategoryManagement />;
}

