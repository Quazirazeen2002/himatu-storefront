import { Container, ButtonLink } from "@/components/ui/Primitives";
export default function NotFound() {
  return (
    <Container className="info-page">
      <p className="eyebrow">404 / UNCHARTED TERRITORY</p>
      <h1>
        A DIFFERENT
        <br />
        UNIVERSE.
      </h1>
      <p>This page isn’t part of the collection.</p>
      <ButtonLink href="/">BACK TO HIMATU</ButtonLink>
    </Container>
  );
}
