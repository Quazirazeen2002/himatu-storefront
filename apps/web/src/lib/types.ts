export interface ProductBase {
  databaseId?: string;
  uploadedImages?: { src: string; alt: string }[];
  isFeatured?: boolean;
  id: string;
  name: string;
  franchise: string;
  collection: string;
  productCategory?: string;
  character: string;
  description: string;
  color: string;
  art: string;
  isNew?: boolean;
  addedAt: number;
  type:
    "Figure" | "Action figure" | "Collectible figurine" | "Collectible concept" | "Keychain" | "Display sword" | "T-shirt" | "Pin";
  photoSource?: { page: string; label: string };
  specifications?: Record<string, string>;
}
export interface FigureProduct extends ProductBase {
  kind?: "figure";
  stockQuantity?: number;
  price: number;
  salePrice?: number | null;
  availability: "in-stock" | "pre-order" | "sold-out";
}
export interface ConceptProduct extends ProductBase {
  kind: "concept";
  price?: never;
  availability?: never;
  specifications?: never;
}
export interface ReferenceProduct extends ProductBase {
  kind: "reference";
  price: number;
  salePrice?: number | null;
  priceIsDemo: false;
  availability?: never;
  source: { page: string; label: string };
  images: { src: string; width: number; height: number }[];
}
export type Product = FigureProduct | ConceptProduct | ReferenceProduct;
export interface Collection {
  imageUrl?: string | null;
  imageIsDemo?: boolean;
  family?: string;
  slug: string;
  name: string;
  caption: string;
  color: string;
  art: string;
}
