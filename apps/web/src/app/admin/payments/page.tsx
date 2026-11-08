import { PaymentManagement } from "@/components/admin/PaymentManagement";

export const metadata = {
  title: "Payments & Settlements · HIMATU Admin",
  description: "Track courier Cash on Delivery collection and payment status.",
};

export default function AdminPaymentsPage() {
  return <PaymentManagement />;
}

