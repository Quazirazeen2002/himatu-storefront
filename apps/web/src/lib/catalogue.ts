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
export const catalogue: Product[] = [...products, ...concepts];
