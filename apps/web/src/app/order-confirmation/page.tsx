import { Suspense } from "react";
import { Container } from "@/components/ui/Primitives";
import { OrderConfirmationView } from "@/components/commerce/OrderConfirmationView";

export const metadata = {
  title: "Order Confirmed · HIMATU",
  description: "Your authentic anime figurine collectible order receipt and dispatch tracking.",
};

export default function ConfirmationPage() {
  return (
    <Container className="page-content confirmation-page-container">
      <Suspense fallback={<p>Loading order details...</p>}>
        <OrderConfirmationView />
      </Suspense>
    </Container>
  );
}
