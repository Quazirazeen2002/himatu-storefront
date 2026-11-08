import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  HeroCampaign,
  PrintingCampaign,
  BrandMessage,
} from "@/components/campaigns/Campaigns";
import {
  Container,
  SectionHeading,
  ButtonLink,
} from "@/components/ui/Primitives";
import { Reveal } from "@/components/ui/Reveal";
import { ProductGrid } from "@/components/products/ProductCard";
import { FigurineSlideshow } from "@/components/products/FigurineSlideshow";
import { AssetImage } from "@/components/products/AssetImage";
import { collections, products } from "@/lib/config";
import { assets, figurePhotos } from "@/lib/assets";
export default function Home() {
  return (
    <div className="premium-landing">
      <HeroCampaign />
      <Container>
        <section
          className="section landing-universes"
          aria-labelledby="universes-heading"
        >
          <Reveal>
            <div className="section-heading">
              <div>
                <p className="eyebrow">FIND THE STORIES YOU LOVE</p>
                <h2 id="universes-heading">
                  YOUR UNIVERSE.
                  <br />
                  YOUR NEXT CHAPTER.
                </h2>
              </div>
              <Link className="text-link" href="/collections">
                All collections <ArrowUpRight size={17} />
              </Link>
            </div>
            <div className="landing-universe-layout">
              <Link
                href="/collections/one-piece"
                className="landing-universe-photo"
              >
                <AssetImage
                  asset={figurePhotos["zoro-three-sword-style"]}
                  sizes="(max-width:767px) 90vw, 55vw"
                />
                <div>
                  <p className="eyebrow">THE HIMATU COLLECTION</p>
                  <h3>ONE PIECE</h3>
                  <span>
                    Explore the collection <ArrowUpRight size={18} />
                  </span>
                </div>
              </Link>
              <div className="landing-worlds">
                <p className="eyebrow">MORE WORLDS TO EXPLORE</p>
                {collections
                  .filter(
                    (c) => !["one-piece", "other-collections"].includes(c.slug),
                  )
                  .map((c) => (
                    <Link key={c.slug} href={`/collections/${c.slug}`}>
                      <div>
                        <h3>{c.name}</h3>
                        <span>Explore universe & collectibles</span>
                      </div>
                      <ArrowUpRight size={22} />
                    </Link>
                  ))}
              </div>
            </div>
          </Reveal>
        </section>
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
      <section
        className="landing-collection-story"
        aria-labelledby="collection-story-heading"
      >
        <div className="landing-story-image">
          <AssetImage
            asset={assets.editorial[0]}
            sizes="(max-width:767px) 90vw, 50vw"
          />
        </div>
        <Reveal className="landing-story-copy">
          <p className="eyebrow">IN FOCUS / ONE PIECE</p>
          <h2 id="collection-story-heading">
            THE STORIES
            <br />
            STAY WITH YOU.
          </h2>
          <p>
            A closer look at the characters in the HIMATU collection. Find the
            next story to make room for.
          </p>
          <ButtonLink href="/collections/one-piece">
            EXPLORE ONE PIECE
          </ButtonLink>
          <span className="art-label">
            FEATURED COLLECTION · ORIGINAL HIMATU PHOTOGRAPHY
          </span>
        </Reveal>
      </section>
      <PrintingCampaign />
      <BrandMessage />
    </div>
  );
}
