import { Container } from "@/components/ui/Primitives";
import { CustomerAccount } from "@/components/commerce/CustomerAccount";

export const metadata = {
  title: "Collector Account · HIMATU",
  description: "Manage your HIMATU collector profile, shipping addresses, orders, and security.",
};

export default function Account() {
  return (
    <Container className="page-content">
      <div className="page-intro">
        <p className="eyebrow">AUTHENTIC COLLECTIBLES / COLLECTOR ACCOUNT</p>
        <h1>
          YOUR COLLECTION.
          <br />
          YOUR SPACE.
        </h1>
        <p>Manage your collector profile, verified shipping addresses, orders, and authentication.</p>
      </div>
      <CustomerAccount />
    </Container>
  );
}
