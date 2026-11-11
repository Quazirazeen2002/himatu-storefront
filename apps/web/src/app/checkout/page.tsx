import { CheckoutForm } from "@/components/commerce/PreviewForms";
import { Container } from "@/components/ui/Primitives";

export const metadata = { title: "Secure Checkout · HIMATU" };

export default function Checkout() {
  return (
    <Container className="page-content checkout-page-wrapper">
      <div className="page-intro checkout-page-intro">
        <p className="eyebrow">YOUR NEXT COLLECTIBLE STARTS HERE</p>
        <h1>CHECKOUT.</h1>
        <p>Review your items and delivery details, then choose a channel to continue your order with HIMATU.</p>
      </div>
      <CheckoutForm />
    </Container>
  );
}
