import { StoreSettings } from "@/components/admin/StoreSettings";

export const metadata = {
  title: "Store Settings · HIMATU Admin",
  description: "Configure business details, shipping rates, and operational thresholds.",
};

export default function AdminSettingsPage() {
  return <StoreSettings />;
}

