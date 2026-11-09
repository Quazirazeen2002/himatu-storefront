import { CheckoutForm } from "@/components/commerce/PreviewForms";
import { Container } from "@/components/ui/Primitives";

export const metadata = { title: "Secure Checkout · HIMATU" };

export default function Checkout() {
  return (
    <Container className="page-content checkout-page-wrapper">
      <div className="page-intro checkout-page-intro">
        <p className="eyebrow">YOUR NEXT COLLECTIBLE STARTS HERE</p>
        <h1>CHECKOUT.</h1>
        <p>Review your bag and delivery details. Send one order request to HIMATU on WhatsApp, or continue with website checkout.</p>
      </div>
      <CheckoutForm />
    </Container>
  );
}
