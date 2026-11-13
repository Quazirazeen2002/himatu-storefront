import { CategoryShowcase } from "@/components/collections/CategoryShowcase";
import { MakingOf } from "@/components/campaigns/MakingOf";
import {
  HeroCampaign,
  PrintingCampaign,
} from "@/components/campaigns/Campaigns";
import { Container, SectionHeading } from "@/components/ui/Primitives";
import { Reveal } from "@/components/ui/Reveal";
import { CollectionMarquee } from "@/components/campaigns/CollectionMarquee";
import { FigurineSlideshow } from "@/components/products/FigurineSlideshow";
import { products } from "@/lib/config";
export default function Home() {
  return (
    <div className="premium-landing">
      <HeroCampaign />
      <CollectionMarquee />
      <Container>
        <CategoryShowcase />
        <section className="section" id="featured-figures">
          <Reveal>
            <SectionHeading
              eyebrow="THE NEXT ADDITION TO YOUR SHELF"
              title="Featured collectibles"
              href="/shop"
              action="Shop all figures"
            />
            <FigurineSlideshow products={products} />
          </Reveal>
        </section>
      </Container>
      <PrintingCampaign />
      <MakingOf />
    </div>
  );
}
