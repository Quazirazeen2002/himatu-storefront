import { CheckoutForm } from "@/components/commerce/PreviewForms";
import { Container } from "@/components/ui/Primitives";

export const metadata = { title: "Secure Checkout · HIMATU" };

export default function Checkout() {
  return (
    <Container className="page-content checkout-page-wrapper">
      <div className="page-intro checkout-page-intro">
        <p className="eyebrow">EXPRESS DISPATCH · NATIONWIDE BANGLADESH</p>
        <h1>CHECKOUT.</h1>
        <p>Review items, select shipping across Bangladesh, and complete your collectible order.</p>
      </div>
      <CheckoutForm />
    </Container>
  );
}
