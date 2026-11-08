import { CampaignBanner, BrandMessage } from "@/components/campaigns/Campaigns";
import {
  Container,
  SectionHeading,
  DemoNotice,
} from "@/components/ui/Primitives";
import { ProductGrid } from "@/components/products/ProductCard";
import { products } from "@/lib/config";
export const metadata = { title: "The world of collecting" };
export default function Campaign() {
  return (
    <>
      <div className="campaign-page-title">
        <p className="eyebrow">HIMATU EDITORIAL</p>
        <h1>
          MAKE ROOM FOR
          <br />
          YOUR WORLD.
        </h1>
      </div>
      <CampaignBanner />
      <Container>
        <section className="section">
          <SectionHeading title="Characters with a place in your world" />
          <ProductGrid products={products.slice(0, 4)} />
          <DemoNotice />
        </section>
      </Container>
      <BrandMessage />
    </>
  );
}
