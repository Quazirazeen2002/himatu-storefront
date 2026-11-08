import { Container } from "@/components/ui/Primitives";
import { ProductCatalog } from "@/components/products/ProductCatalog";
export const metadata = { title: "Your wishlist" };
export default function Wishlist() {
  return (
    <Container className="page-content">
      <div className="page-intro">
        <p className="eyebrow">THE ONES YOU KEEP COMING BACK TO</p>
        <h1>YOUR WISHLIST.</h1>
        <p>
          Save your favourite authentic Japanese anime figurines and statues to your personal collection wishlist.
        </p>
      </div>
      <ProductCatalog wishlist />
    </Container>
  );
}
