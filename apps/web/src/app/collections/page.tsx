import { Container } from "@/components/ui/Primitives";
import { CollectionGrid } from "@/components/collections/CollectionGrid";
export const metadata = { title: "Anime universes" };
export default function Collections() {
  return (
    <Container className="page-content">
      <div className="page-intro">
        <p className="eyebrow">THE STORIES THAT STAY WITH YOU</p>
        <h1>
          CHOOSE YOUR
          <br />
          UNIVERSE.
        </h1>
        <p>Find a familiar world. Discover a new obsession.</p>
      </div>
      <CollectionGrid />
    </Container>
  );
}
