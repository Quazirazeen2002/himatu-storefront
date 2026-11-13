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
  "collector-pin": { id: "collector-pin", src: "/images/sourced/straw-hat-pin.webp", alt: "One Piece Straw Hat emblem pin in the original ABYstyle source photograph", width: 1200, height: 1200, placeholder: false, fit: "contain" },
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
  "ember-vanguard": concept("ember-vanguard", "AI-generated Ember Vanguard collectible concept with copper hair, ivory armor and a mechanical gauntlet; not for sale"),
  "tidebound-oracle": concept("tidebound-oracle", "AI-generated Tidebound Oracle collectible concept with teal robes, astrolabe staff and sculpted waves; not for sale"),
  "ironwood-ranger": concept("ironwood-ranger", "AI-generated Ironwood Ranger collectible concept with a green cloak and mechanical longbow; not for sale"),
  "lunar-mechanist": concept("lunar-mechanist", "AI-generated Lunar Mechanist collectible concept with silver armor and a companion automaton; not for sale"),
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
  collection: (c: Collection): ImageAsset => ({
    id: c.slug, src: c.imageUrl || "/images/categories/category-default.svg",
    alt: c.imageIsDemo ? `${c.name} illustrated category cover; not a photograph of actual inventory` : `${c.name} collection cover`,
    width: 1200, height: 1500, placeholder: false, fit: "cover",
  }),
  product: (p: Product): ImageAsset =>
    p.uploadedImages?.length ? { id: p.id, ...p.uploadedImages[0], width: 1200, height: 1500, placeholder: false, fit: "contain" }
    : p.kind === "reference" ? { id: p.id, ...p.images[0], alt: `${p.character} — ${p.name}; original product photograph from ${p.source.label}`, placeholder: false, fit: "contain" }
    : (p.kind === "concept" ? conceptImages[p.id] : figurePhotos[p.id]) || { id: p.id, alt: `${p.name} photography coming soon`, width: 1200, height: 1500, placeholder: true },
  gallery: (p: Product): ImageAsset[] => p.uploadedImages?.length
    ? p.uploadedImages.map((image, index) => ({ id: `${p.id}-${index}`, ...image, width: 1200, height: 1500, placeholder: false, fit: "contain" }))
    : p.kind === "reference" ? p.images.map((image,index) => ({ id: `${p.id}-${index}`, ...image, alt: `${p.name}, source product photograph ${index + 1}`, placeholder: false, fit: "contain" })) : [assets.product(p)],
};
