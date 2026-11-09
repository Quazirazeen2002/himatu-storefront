import Link from "next/link";
import { Container } from "@/components/ui/Primitives";
import { CollectionGrid } from "@/components/collections/CollectionGrid";
import { storefrontCategories } from "@/lib/server-categories";
import { categoryKind, familyLabels } from "@/lib/taxonomy";
export const dynamic = "force-dynamic";
export const metadata = { title: "Anime & franchise collections" };
export default async function Collections({ searchParams }: { searchParams: Promise<{ family?: string }> }) {
  const { family: requested } = await searchParams;
  const family = requested === "ALL" || requested && requested in familyLabels ? requested : "ANIME";
  const categories = (await storefrontCategories()).filter(category => categoryKind(category) === "FRANCHISE" && (family === "ALL" || category.family === family));
  return <Container className="page-content"><div className="page-intro"><p className="eyebrow">FIND THE STORIES YOU LOVE</p><h1>{family === "ANIME" ? "ANIME" : "CHOOSE YOUR"}<br />{family === "ANIME" ? "COLLECTIONS." : "UNIVERSE."}</h1><p>One Piece, Naruto, Dragon Ball and more. Product categories and franchises work together, so you can explore your fandom in different forms.</p></div><nav className="taxonomy-families" aria-label="Collection families">{[["ALL","All worlds"], ...Object.entries(familyLabels)].map(([key,label]) => <Link key={key} href={`/collections?family=${key}`} aria-current={family === key ? "page" : undefined}>{label}</Link>)}</nav><CollectionGrid categories={categories} /><p className="taxonomy-disclosure">Covers marked Demo Artwork are original illustrative category previews. They do not imply licensed merchandise, confirmed inventory or product availability.</p></Container>;
}
