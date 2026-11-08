import "@/components/home/cinematic.css";
import { HeroSection } from "@/components/home/HeroSection";
import { AnimeUniverses } from "@/components/home/AnimeUniverses";
import { FeaturedShowcase } from "@/components/home/FeaturedShowcase";
import { CustomPrintingSection } from "@/components/home/CustomPrintingSection";
import { EditorialSection } from "@/components/home/EditorialSection";
import { BrandStatementSection } from "@/components/home/BrandStatementSection";

export const metadata = {
  title: "HIMATU — Premium Anime Figures & Collectibles",
  description:
    "Discover premium anime figures and collectibles in Bangladesh. One Piece, Naruto, Dragon Ball, Jujutsu Kaisen, Demon Slayer and bespoke 3D printing.",
};

export default function Home() {
  return (
    <main className="cinematic-page">
      <HeroSection />
      <AnimeUniverses />
      <FeaturedShowcase />
      <CustomPrintingSection />
      <EditorialSection />
      <BrandStatementSection />
    </main>
  );
}
