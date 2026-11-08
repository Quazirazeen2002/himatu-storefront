import { ContactForm } from "@/components/services/ContactForm";
import { notFound } from "next/navigation";
import { information } from "@/lib/config";
import { Container, ButtonLink } from "@/components/ui/Primitives";
export function generateStaticParams() {
  return Object.keys(information).map((page) => ({ page }));
}
export default async function Info({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page } = await params;
  const content = information[page];
  if (!content) notFound();
  return (
    <Container className="info-page">
      <p className="eyebrow">HIMATU / {page.replaceAll("-", " ")}</p>
      <h1>{content.title}</h1>
      <p className="info-body">{content.body}</p>
      {page === "about" && (
        <section className="info-details">
          <h2>A place for your fandom.</h2>
          <p>
            From One Piece and Naruto to Dragon Ball, Jujutsu Kaisen and Demon
            Slayer, HIMATU brings the focus back to characters, stories and the
            joy of collecting.
          </p>
          <h2>Discover. Collect. Display.</h2>
          <p>
            Explore anime figures, collectible figurines and action figures,
            alongside the possibilities of custom 3D printing. Our current
            storefront is an interactive demonstration while the real catalogue
            and business details are prepared.
          </p>
        </section>
      )}
      {page === "contact" && <ContactForm />}
      {page === "faqs" && (
        <section className="info-details">
          {[
            [
              "Can I buy a figure here?",
              "You can try the bag, wishlist and checkout review. Products, prices and stock states are demonstrations; no purchases or payments are accepted.",
            ],
            [
              "Will my favourites be saved?",
              "Demo bag, wishlist and recently viewed product IDs are saved in this browser when storage is available. Clearing browser storage removes them.",
            ],
            [
              "Are these actual product photographs?",
              "Yes. Product photographs were supplied by HIMATU. Prices, availability, materials, dimensions and manufacturer information still require confirmation.",
            ],
            [
              "Can I request a 3D printing quotation?",
              "You can validate an example inquiry and preview a local image. Nothing is sent to HIMATU.",
            ],
            [
              "Where are the shipping and return policies?",
              "Shipping charges, coverage, timings and return terms will be published once approved. No policies are promised by this preview.",
            ],
          ].map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </section>
      )}
      {["privacy", "terms", "shipping-returns"].includes(page) && (
        <section className="info-details">
          <h2>
            {page === "privacy"
              ? "Your browser, your demo selections."
              : page === "terms"
                ? "A preview with clear boundaries."
                : "Before you order."}
          </h2>
          <p>
            {page === "privacy"
              ? "This preview stores product IDs and quantities in localStorage under himatu-demo-v2. You can remove them through your browser’s site-data controls. Inquiry images use temporary local object URLs; refreshing or leaving the form removes the selected reference. Form entries are not sent to a server. This explanation is not a substitute for the final approved privacy policy."
              : page === "terms"
                ? "Nothing displayed here constitutes a verified product offer, stock promise or accepted order. Account and checkout validation happen locally. The approved business terms will replace this notice before launch."
                : "Delivery method and payment selections are visual demonstrations. No delivery fee is calculated and no delivery date is promised. Review the final shipping and return terms before purchases are introduced."}
          </p>
        </section>
      )}
      <ButtonLink href="/shop" variant="outline">
        EXPLORE THE COLLECTION
      </ButtonLink>
    </Container>
  );
}
