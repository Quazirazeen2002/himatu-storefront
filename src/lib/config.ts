import type { Collection, FigureProduct } from "./types";
export const navigation = [
  { label: "Shop All", href: "/shop" },
  { label: "Collections", href: "/collections" },
  { label: "New Arrivals", href: "/shop?new=1&sort=new" },
  { label: "3D Printing", href: "/3d-printing" },
];
export const collections: Collection[] = [
  {
    slug: "one-piece",
    name: "One Piece",
    caption: "Adventure without limits.",
    color: "#b45435",
    art: "pirate",
  },
  {
    slug: "naruto",
    name: "Naruto",
    caption: "The will to keep going.",
    color: "#b97829",
    art: "ninja",
  },
  {
    slug: "dragon-ball",
    name: "Dragon Ball",
    caption: "Beyond your limits.",
    color: "#777b4b",
    art: "warrior",
  },
  {
    slug: "jujutsu-kaisen",
    name: "Jujutsu Kaisen",
    caption: "Enter the extraordinary.",
    color: "#666789",
    art: "sorcerer",
  },
  {
    slug: "demon-slayer",
    name: "Demon Slayer",
    caption: "A spirit that never breaks.",
    color: "#3d7467",
    art: "swordsman",
  },
  {
    slug: "other-collections",
    name: "Other Collections",
    caption: "More worlds to discover.",
    color: "#686868",
    art: "warrior",
  },
];
// Photographs and character names reflect the supplied images. All prices and stock states remain demo fixtures.
export const products: FigureProduct[] = [
  {
    id: "straw-hat-captain",
    name: "Luffy · Gear Five",
    character: "Monkey D. Luffy",
    description:
      "Luffy in Gear Five, seated with blue effect pieces. Shown in the original HIMATU photograph.",
    price: 6500,
  },
  {
    id: "zoro-three-sword-style",
    name: "Zoro · Three Sword Style",
    character: "Roronoa Zoro",
    description:
      "Zoro in a three-sword pose with purple effect pieces. Shown in the original HIMATU photograph.",
    price: 4800,
  },
  {
    id: "ace-chibi",
    name: "Ace · Chibi Figure",
    character: "Portgas D. Ace",
    description:
      "A smiling chibi Ace wearing his orange hat. Shown in the original HIMATU photograph.",
    price: 7200,
  },
  {
    id: "zoro-asura",
    name: "Zoro · Asura Display",
    character: "Roronoa Zoro",
    description:
      "Zoro in an elaborate display composition with an Asura-inspired backdrop. Shown in the original HIMATU photograph.",
    price: 5900,
  },
  {
    id: "sanji-chibi",
    name: "Sanji · Chibi Figure",
    character: "Sanji",
    description:
      "A smiling chibi Sanji resting his chin on his hands. Shown in the original HIMATU photograph.",
    price: 6200,
  },
  {
    id: "luffy-gear-five-action",
    name: "Luffy · Gear Five Action",
    character: "Monkey D. Luffy",
    description:
      "Luffy in a dynamic Gear Five pose with pink and orange effect pieces. Shown in the original HIMATU photograph.",
    price: 6500,
  },
  {
    id: "zoro-chibi",
    name: "Zoro · Chibi Figure",
    character: "Roronoa Zoro",
    description:
      "A green-haired chibi Zoro with swords. Shown in the original HIMATU photograph.",
    price: 4800,
  },
].map((p, index) => ({
  ...p,
  franchise: "One Piece",
  collection: "one-piece",
  color: "#b45435",
  art: "pirate",
  isNew: false,
  availability: (
    [
      "in-stock",
      "in-stock",
      "pre-order",
      "in-stock",
      "sold-out",
      "in-stock",
      "in-stock",
    ] as const
  )[index],
  type: "Collectible figurine",
  addedAt: 7 - index,
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
    body: "Contact details will be published here when confirmed by HIMATU. In the meantime, explore the collection preview.",
  },
  faqs: {
    title: "A LITTLE MORE CLARITY.",
    body: "This is the Stage 2 storefront preview. Products, prices and availability are demonstration content. Shopping interactions are browser demonstrations. Payments and account services are not available.",
  },
  privacy: {
    title: "PRIVACY POLICY",
    body: "The approved privacy policy will be published before launch. This preview does not submit your form entries to a server. Demo bag, wishlist and recently viewed product IDs are stored in this browser. Form entries are never sent to a server.",
  },
  terms: {
    title: "TERMS OF USE",
    body: "The business terms are awaiting approval. This storefront is a design demonstration and does not accept purchases or create accounts.",
  },
  "shipping-returns": {
    title: "SHIPPING & RETURNS",
    body: "Delivery regions, charges, timelines and return conditions will be confirmed before launch. No shipping or return promises are made in this preview.",
  },
};
