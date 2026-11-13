import { fallbackCategories, asCollection, categoryKind } from "./taxonomy";
import { salePriceForDiscount } from "./pricing";
import type { Collection, FigureProduct } from "./types";
export const navigation = [
  { label: "Shop All", href: "/shop" },
  { label: "Categories", href: "/categories" },
  { label: "Collections", href: "/collections" },
  { label: "3D Printing", href: "/3d-printing" },
  { label: "About", href: "/about" },
];
export const collections: Collection[] = fallbackCategories.filter(category => categoryKind(category) === "FRANCHISE").map(asCollection);
// Original prices are preserved. Owner approved a 15% introductory discount on 9 November 2026.
// Live admin-managed prices override these local catalogue fallbacks in StoreProvider.
export const catalogueDiscountPercent = 15;
export const products: FigureProduct[] = [
  {
    id: "straw-hat-captain",
    name: "Luffy · Gear Five",
    character: "Monkey D. Luffy",
    description:
      "Bring the spirit of Gear Five to your display. Luffy’s relaxed pose and sweeping blue effects create a striking contrast of calm and energy.",
    price: 6500,
  },
  {
    id: "zoro-three-sword-style",
    name: "Zoro · Three Sword Style",
    character: "Roronoa Zoro",
    description:
      "A moment of focus, captured in three swords. Zoro’s poised stance and purple effects give this composition a bold, unmistakable silhouette.",
    price: 4800,
  },
  {
    id: "ace-chibi",
    name: "Ace · Chibi Figure",
    character: "Portgas D. Ace",
    description:
      "Small in scale, full of character. Ace’s signature orange hat and easy smile bring a playful note to a character-led display.",
    price: 7200,
  },
  {
    id: "zoro-asura",
    name: "Zoro · Asura Display",
    character: "Roronoa Zoro",
    description:
      "Build your display around a dramatic focal point. This Zoro composition pairs an Asura-inspired backdrop with layered forms that reward a closer look.",
    price: 5900,
  },
  {
    id: "sanji-chibi",
    name: "Sanji · Chibi Figure",
    character: "Sanji",
    description:
      "A quieter kind of presence. Sanji’s expressive smile and relaxed pose bring warmth and personality to this compact chibi composition.",
    price: 6200,
  },
  {
    id: "luffy-gear-five-action",
    name: "Luffy · Gear Five Action",
    character: "Monkey D. Luffy",
    description:
      "UNLEASH GEAR FIVE. Luffy takes centre stage in a burst of pink and orange — a fearless pose, flowing effects, and unmistakable Straw Hat energy. Give your favourite captain the spotlight.",
    price: 6500,
  },
  {
    id: "zoro-chibi",
    name: "Zoro · Chibi Figure",
    character: "Roronoa Zoro",
    description:
      "The swordsman, reimagined with chibi charm. Green hair, a compact stance and distinctive swords make Zoro instantly recognizable on your shelf.",
    price: 4800,
  },
  {
    id: "collector-pin",
    name: "HIMATU Collector Pin · Straw Hat Emblem",
    character: "Monkey D. Luffy",
    description:
      "Small symbol. Big adventure. A Straw Hat emblem pin brings a touch of One Piece to an everyday collection. Confirm the exact item and availability with HIMATU.",
    price: 20,
  },
].map((p, index) => ({
  ...p,
  photoSource: p.id === "collector-pin" ? { page: "https://trade.abyssecorp.com/en/pins/205187-one-piece-pin-strawhat-x4-3665361095873.html", label: "ABYstyle / Abysse Corp" } : undefined,
  productCategory: p.id === "collector-pin" ? "accessories" : "action-figures",
  salePrice: salePriceForDiscount(p.price, catalogueDiscountPercent),
  franchise: "One Piece",
  collection: "one-piece",
  color: "#b45435",
  art: "pirate",
  isNew: index === 7,
  availability: (
    [
      "in-stock",
      "in-stock",
      "pre-order",
      "in-stock",
      "sold-out",
      "in-stock",
      "in-stock",
      "in-stock",
    ] as const
  )[index],
  type: p.id === "collector-pin" ? "Pin" : "Collectible figurine",
  addedAt: 8 - index,
}));
// Old demo URLs stay usable without assigning unrelated photos to the wrong characters.
export const retiredProductCollections: Record<string, string> = {
  "leaf-village-shinobi": "naruto",
  "limitless-sorcerer": "jujutsu-kaisen",
  "sun-breathing-swordsman": "demon-slayer",
  "earths-warrior": "dragon-ball",
};
export const availabilityLabel = {
  "in-stock": "In stock",
  "pre-order": "Pre-order",
  "sold-out": "Sold out",
} as const;
export const formatPrice = (value: number) =>
  `৳ ${new Intl.NumberFormat("en-BD").format(value)}`;
export const information: Record<string, { title: string; body: string }> = {
  about: {
    title: "FOR THE LOVE OF COLLECTING.",
    body: "HIMATU is a premium anime figures and collectibles brand in Bangladesh. A place to discover characters, build a collection, and make your fandom part of your everyday world.",
  },
  contact: {
    title: "LET’S TALK.",
    body: "Talk to HIMATU on WhatsApp at 01714546809 for product enquiries, order assistance and custom 3D printing.",
  },
  faqs: {
    title: "A LITTLE MORE CLARITY.",
    body: "Find answers about collecting, accounts, ordering and custom 3D printing.",
  },
  privacy: {
    title: "PRIVACY POLICY",
    body: "HIMATU uses the information you provide to manage your account, respond to enquiries and handle order requests. Share only the details needed for your request.",
  },
  terms: {
    title: "TERMS OF USE",
    body: "Browse the collection, save your favourites and review your selections before ordering. You need an account to proceed to checkout.",
  },
  "shipping-returns": {
    title: "SHIPPING & RETURNS",
    body: "Delivery charges and estimated service options appear during checkout. Contact HIMATU about delivery coverage, your exact edition and return eligibility before confirming an order.",
  },
};
