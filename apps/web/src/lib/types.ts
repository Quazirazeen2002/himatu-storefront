export interface ProductBase {
  id: string;
  name: string;
  franchise: string;
  collection: string;
  character: string;
  description: string;
  color: string;
  art: string;
  isNew?: boolean;
  addedAt: number;
  type:
    "Figure" | "Action figure" | "Collectible figurine" | "Collectible concept";
  specifications?: {
    material?: string;
    dimensions?: string;
    manufacturer?: string;
    packaging?: string;
  };
}
export interface FigureProduct extends ProductBase {
  kind?: "figure";
  price: number;
  availability: "in-stock" | "pre-order" | "sold-out";
}
export interface ConceptProduct extends ProductBase {
  kind: "concept";
  price?: never;
  availability?: never;
  specifications?: never;
}
export type Product = FigureProduct | ConceptProduct;
export interface Collection {
  slug: string;
  name: string;
  caption: string;
  color: string;
  art: string;
}
