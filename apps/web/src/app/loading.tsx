import { Container } from "@/components/ui/Primitives";
export default function Loading() {
  return (
    <Container className="page-content">
      <div className="page-intro">
        <p className="eyebrow" role="status">
          LOADING YOUR NEXT CHAPTER…
        </p>
      </div>
      <div className="product-grid" aria-hidden="true">
        {[1, 2, 3, 4].map((i) => (
          <div className="skeleton" key={i} />
        ))}
      </div>
    </Container>
  );
}
