import { Container } from "@/components/ui/Primitives";
import { ProductCatalog } from "@/components/products/ProductCatalog";
export const metadata = { title: "Shop all products" };
export default function Shop() {
  return (
    <Container>
      <div className="page-intro">
        <p className="eyebrow">YOUR COLLECTION STARTS HERE</p>
        <h1>
          FIND YOUR NEXT
          <br />
          FAVOURITE.
        </h1>
        <p>Characters you connect with. A world to call your own.</p>
      </div>
      <ProductCatalog />
    </Container>
  );
}
