import type { Product, Collection } from "./types";
export interface ImageAsset {
  id: string;
  src?: string;
  alt: string;
  width: number;
  height: number;
  view?: "front" | "detail" | "display";
  placeholder: boolean;
  fit?: "contain" | "cover";
}
// Original uploads remain unchanged. Sources are local so no Facebook URL can expire.
export const figurePhotos: Record<string, ImageAsset> = {
  "straw-hat-captain": photo(
    "luffy-gear-five",
    "874109780_122155860429356138_159630139292783632_n.jpg",
    "Monkey D. Luffy Gear Five figure seated on a display stand at HIMATU",
  ),
  "zoro-three-sword-style": photo(
    "zoro-three-sword",
    "867155812_122155861425356138_1955209043147405711_n.jpg",
    "Roronoa Zoro figure with three swords and purple effect pieces at HIMATU",
  ),
  "ace-chibi": photo(
    "ace-chibi",
    "876048683_122155861521356138_4631002917188527144_n.jpg",
    "Portgas D. Ace chibi figure wearing an orange hat at HIMATU",
  ),
  "zoro-asura": photo(
    "zoro-asura",
    "869689144_122155861029356138_6211747126010481950_n.jpg",
    "Roronoa Zoro figure with an Asura-inspired backdrop and dragon composition at HIMATU",
  ),
  "sanji-chibi": photo(
    "sanji-chibi",
    "867640567_122155861473356138_4650069518476672319_n.jpg",
    "Sanji chibi figure smiling with his chin resting on his hands at HIMATU",
  ),
  "luffy-gear-five-action": photo(
    "luffy-action",
    "862314978_122155859979356138_1917160491667365230_n.jpg",
    "Monkey D. Luffy Gear Five figure in an action pose with pink and orange effects at HIMATU",
  ),
  "zoro-chibi": photo(
    "zoro-chibi",
    "867463200_122155860927356138_2040773041185832800_n.jpg",
    "Roronoa Zoro chibi figure with green hair and swords at HIMATU",
  ),
};
function photo(id: string, file: string, alt: string): ImageAsset {
  return {
    id,
    src: `/images/figures/${file}`,
    alt,
    width: 1536,
    height: 2048,
    placeholder: false,
    fit: "contain",
  };
}
export const conceptImages: Record<string, ImageAsset> = {
  "aether-forged-swordsman": concept(
    "aether-forged-swordsman",
    "Original fantasy swordsman AI-generated figurine concept, armored with ivory sculpted fabric; not for sale",
  ),
  "celestial-wayfarer": concept(
    "celestial-wayfarer",
    "Original celestial warrior AI-generated figurine concept with flowing silver hair and ornate blue costume; not for sale",
  ),
  "veiled-shadow-fighter": concept(
    "veiled-shadow-fighter",
    "Original masked shadow fighter AI-generated figurine concept with layered clothing and display base; not for sale",
  ),
};
function concept(id: string, alt: string): ImageAsset {
  return {
    id,
    src: `/images/concepts/${id}.webp`,
    alt,
    width: 1086,
    height: 1448,
    placeholder: false,
    fit: "contain",
  };
}
export const assets = {
  home: figurePhotos["luffy-gear-five-action"],
  editorial: [figurePhotos["zoro-asura"], figurePhotos["straw-hat-captain"]],
  collection: (c: Collection): ImageAsset =>
    c.slug === "one-piece"
      ? { ...figurePhotos["zoro-three-sword-style"], fit: "cover" }
      : c.slug === "other-collections"
        ? conceptImages["celestial-wayfarer"]
        : {
            id: c.slug,
            alt: `${c.name} photography coming soon`,
            width: 500,
            height: 600,
            placeholder: true,
          },
  product: (p: Product): ImageAsset =>
    p.kind === "concept" ? conceptImages[p.id] : figurePhotos[p.id],
  gallery: (p: Product): ImageAsset[] => [
    p.kind === "concept" ? conceptImages[p.id] : figurePhotos[p.id],
  ],
};
