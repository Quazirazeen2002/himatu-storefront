import Link from "next/link";
import { BagItems, OrderSummary } from "@/components/commerce/Commerce";
import { Container, DemoNotice } from "@/components/ui/Primitives";
export const metadata = { title: "Your bag" };
export default function Bag() {
  return (
    <Container className="page-content">
      <div className="page-intro">
        <p className="eyebrow">A PLACE FOR YOUR NEXT FAVOURITE</p>
        <h1>YOUR BAG.</h1>
        <p>Review items, adjust quantities, and proceed to secure checkout.</p>
      </div>
      <div className="commerce-layout">
        <div>
          <BagItems />
          <div className="continue-shopping">
            <Link className="text-link" href="/shop">
              Continue shopping
            </Link>
          </div>
        </div>
        <OrderSummary />
      </div>
    </Container>
  );
}
