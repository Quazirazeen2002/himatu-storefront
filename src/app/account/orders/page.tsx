import { Container, ButtonLink, DemoNotice } from "@/components/ui/Primitives";
export const metadata = { title: "Order history preview" };
export default function Orders() {
  return (
    <Container className="page-content">
      <div className="page-intro">
        <p className="eyebrow">YOUR HIMATU / ORDER HISTORY</p>
        <h1>
          YOUR COLLECTION’S
          <br />
          NEXT CHAPTER.
        </h1>
        <DemoNotice>
          Order history is not connected. No customer account or historical
          orders are loaded.
        </DemoNotice>
      </div>
      <div className="empty-state">
        <h2>No real order history is available.</h2>
        <p>Demo bag selections and checkout reviews do not create orders.</p>
        <ButtonLink href="/shop">EXPLORE FIGURES</ButtonLink>
        <ButtonLink href="/account" variant="text">
          BACK TO ACCOUNT
        </ButtonLink>
      </div>
    </Container>
  );
}
