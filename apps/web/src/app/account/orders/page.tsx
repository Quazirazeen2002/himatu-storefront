import { Container } from "@/components/ui/Primitives";
import { OrderHistory } from "@/components/commerce/OrderHistory";

export const metadata = {
  title: "My Collection Orders · HIMATU",
  description: "Track your authentic Japanese figurine orders, delivery status, and history.",
};

export default function OrdersPage() {
  return (
    <Container className="page-content">
      <div className="page-intro">
        <p className="eyebrow">YOUR HIMATU / COLLECTION ORDERS</p>
        <h1>
          ORDER HISTORY.
          <br />
          AUTHENTIC COLLECTIBLES.
        </h1>
        <p>Review and track your authentic scale figures, statue deliveries, and receipts.</p>
      </div>
      <OrderHistory />
    </Container>
  );
}
