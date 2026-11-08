import { DemoConfirmation } from "@/components/commerce/DemoConfirmation";
import { Container, ButtonLink, DemoNotice } from "@/components/ui/Primitives";
export const metadata = { title: "Confirmation layout preview" };
export default function Confirmation() {
  return (
    <Container className="confirmation">
      <p className="eyebrow">ORDER CONFIRMATION / DESIGN PREVIEW</p>
      <h1>
        A NEW CHAPTER
        <br />
        FOR YOUR COLLECTION.
      </h1>
      <DemoNotice>
        No order has been placed. This is a demonstration confirmation view; you
        have not paid or purchased anything.
      </DemoNotice>
      <DemoConfirmation />
      <ButtonLink href="/shop">CONTINUE EXPLORING</ButtonLink>
    </Container>
  );
}
