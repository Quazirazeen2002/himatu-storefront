import { ProductionKanban } from "@/components/admin/ProductionKanban";

export const metadata = {
  title: "Production Kanban Board · HIMATU Admin",
  description: "Track 10-stage custom 3D printing and master hand-painting pipeline.",
};

export default function AdminProductionPage() {
  return <ProductionKanban />;
}

