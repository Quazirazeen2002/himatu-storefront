import { CustomerDirectory } from "@/components/admin/CustomerDirectory";

export const metadata = {
  title: "Customers Directory · HIMATU Admin",
  description: "Customer accounts, delivery addresses, and lifetime purchase profiles.",
};

export default function AdminCustomersPage() {
  return <CustomerDirectory />;
}

