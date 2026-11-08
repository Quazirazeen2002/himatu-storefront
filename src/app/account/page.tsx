import { Container, ButtonLink, DemoNotice } from "@/components/ui/Primitives";
export const metadata = { title: "My account" };
export default function Account() {
  return (
    <Container className="page-content">
      <div className="page-intro">
        <p className="eyebrow">YOUR HIMATU</p>
        <h1>
          YOUR COLLECTION.
          <br />
          YOUR SPACE.
        </h1>
        <DemoNotice>
          Account foundation. No active login, profile, address book or order
          history is available.
        </DemoNotice>
      </div>
      <div className="account-grid">
        <div className="preview-panel">
          <h2>Welcome to your universe.</h2>
          <p>Account services will be connected in a later stage.</p>
          <ButtonLink href="/sign-in">PREVIEW SIGN IN</ButtonLink>
        </div>
        <div className="preview-panel">
          <h2>Saved for later.</h2>
          <p>Keep your favourite sample figures together.</p>
          <ButtonLink href="/wishlist" variant="outline">
            VIEW WISHLIST
          </ButtonLink>
        </div>
        <div className="preview-panel">
          <h2>Your order history.</h2>
          <p>No real orders are created in this preview.</p>
          <ButtonLink href="/account/orders" variant="outline">
            VIEW ORDER HISTORY
          </ButtonLink>
        </div>
      </div>
    </Container>
  );
}
