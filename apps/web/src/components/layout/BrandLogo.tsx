import Image from "next/image";

export function BrandLogo({ signature = false }: { signature?: boolean }) {
  const name = signature ? "signature" : "wordmark";
  return (
    <span className={`brand-logo ${signature ? "brand-logo--signature" : ""}`}>
      <Image className="brand-logo-on-dark" src={`/images/brand/${name}-light.webp`} alt="HIMATU" width={signature ? 360 : 600} height={signature ? 273 : 113} unoptimized />
      <Image className="brand-logo-on-light" src={`/images/brand/${name}-dark.webp`} alt="HIMATU" width={signature ? 360 : 600} height={signature ? 273 : 113} unoptimized />
    </span>
  );
}
