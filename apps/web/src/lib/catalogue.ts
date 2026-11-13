import { products } from "./config";
import type { ConceptProduct, Product } from "./types";
export const CONCEPT_LABEL = "AI-GENERATED CONCEPT — NOT FOR SALE";
export const concepts: ConceptProduct[] = [
  {
    id: "aether-forged-swordsman",
    name: "Aether-forged Swordsman",
    character: "Aether-forged Swordsman",
    description:
      "An original fictional fantasy swordsman visual concept with detailed armor and sculpted fabric. AI-generated imagery only; no physical product, material, dimensions or manufacturing specifications are confirmed.",
  },
  {
    id: "celestial-wayfarer",
    name: "Celestial Wayfarer",
    character: "Celestial Wayfarer",
    description:
      "An original fictional celestial warrior visual concept with flowing hair and an elaborate costume. AI-generated imagery only; no physical product, material, dimensions or manufacturing specifications are confirmed.",
  },
  {
    id: "veiled-shadow-fighter",
    name: "Veiled Shadow Fighter",
    character: "Veiled Shadow Fighter",
    description:
      "An original fictional masked shadow fighter visual concept with layered clothing and an intricate display base. AI-generated imagery only; no physical product, material, dimensions or manufacturing specifications are confirmed.",
  },
  {
    id: "ember-vanguard", name: "Ember Vanguard", character: "Ember Vanguard",
    description: "Copper hair, angular ivory armor and a sculpted ember-red sash give this original character a commanding silhouette. A fictional visual study in strength and movement; AI-generated concept, not a physical product.",
  },
  {
    id: "tidebound-oracle", name: "Tidebound Oracle", character: "Tidebound Oracle",
    description: "Sea-green robes meet sweeping wave forms in an original character study built around balance and motion. The bronze astrolabe adds a celestial focal point. AI-generated concept, not a physical product.",
  },
  {
    id: "ironwood-ranger", name: "Ironwood Ranger", character: "Ironwood Ranger",
    description: "Layered woodland textures, a sculpted cloak and a mechanical longbow define this original ranger. A character concept with an unmistakable forest silhouette. AI-generated concept, not a physical product.",
  },
  {
    id: "lunar-mechanist", name: "Lunar Mechanist", character: "Lunar Mechanist",
    description: "Silver ceramic armor, a crescent engineering tool and a small mechanical companion bring a quiet science-fiction story into focus. An original fictional character; AI-generated concept, not a physical product.",
  },
].map((p, index) => ({
  ...p,
  kind: "concept",
  franchise: "Original concept",
  collection: "other-collections",
  type: "Collectible concept",
  color: "#737373",
  art: "concept",
  isNew: false,
  addedAt: -index,
}));
export const catalogue: Product[] = [...products];
