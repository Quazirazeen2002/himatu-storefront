"use client";
import { Container, Button, ButtonLink } from "@/components/ui/Primitives";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <Container className="info-page">
      <p className="eyebrow">A PAUSE IN THE STORY</p>
      <h1>
        LET’S TRY
        <br />
        THAT AGAIN.
      </h1>
      <p className="info-body">
        This view could not load. Your saved demo bag and wishlist remain in
        this browser.
      </p>
      <div className="checkout-controls">
        <Button onClick={reset}>TRY AGAIN</Button>
        <ButtonLink href="/shop" variant="outline">
          BACK TO SHOP
        </ButtonLink>
      </div>
    </Container>
  );
}
