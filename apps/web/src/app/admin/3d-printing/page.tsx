import { PrintingManagement } from "@/components/admin/PrintingManagement";

export const metadata = {
  title: "Custom 3D Printing · HIMATU Admin",
  description: "Operations console for bespoke figurine SLA/resin 3D printing requests.",
};

export default function AdminPrintingPage() {
  return <PrintingManagement />;
}

