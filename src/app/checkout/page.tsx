import { CheckoutForm } from "@/components/commerce/PreviewForms";
import { OrderSummary } from "@/components/commerce/Commerce";
import { Container, ButtonLink } from "@/components/ui/Primitives";
export const metadata = { title: "Checkout preview" };
export default function Checkout() {
  return (
    <Container className="page-content">
      <div className="page-intro">
        <p className="eyebrow">DELIVERY / PAYMENT / REVIEW</p>
        <h1>CHECKOUT PREVIEW.</h1>
        <p>This design preview cannot accept payments or place orders.</p>
      </div>
      <div className="commerce-layout">
        <CheckoutForm />
        <div>
          <OrderSummary checkoutLink={false} />
          <ButtonLink href="/order-confirmation" variant="text">
            VIEW CONFIRMATION LAYOUT
          </ButtonLink>
        </div>
      </div>
    </Container>
  );
}
