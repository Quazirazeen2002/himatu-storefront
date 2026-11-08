import {
  HeroCampaign,
  PrintingCampaign,
  BrandMessage,
} from "@/components/campaigns/Campaigns";
import {
  Container,
  DemoNotice,
  SectionHeading,
} from "@/components/ui/Primitives";
import { Reveal } from "@/components/ui/Reveal";
import { ProductGrid } from "@/components/products/ProductCard";
import { CollectionGrid } from "@/components/collections/CollectionGrid";
import { products } from "@/lib/config";
export default function Home() {
  return (
    <>
      <HeroCampaign />
      <Container>
        <section className="section" id="featured-figures">
          <Reveal>
            <SectionHeading
              eyebrow="THE NEXT ADDITION TO YOUR SHELF"
              title="Featured figures"
              href="/shop"
              action="Shop all figures"
            />
            <ProductGrid products={products.slice(0, 6)} />
            <DemoNotice />
          </Reveal>
        </section>
        <section className="section universe-section">
          <Reveal>
            <SectionHeading
              eyebrow="FIND THE STORIES YOU LOVE"
              title="Shop by anime universe"
              href="/collections"
              action="All universes"
            />
            <CollectionGrid compact />
          </Reveal>
        </section>
      </Container>
      <PrintingCampaign />
      <BrandMessage />
    </>
  );
}
