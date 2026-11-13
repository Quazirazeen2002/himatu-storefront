import type { CategoryDto } from "./types/commerce";
export type CategoryTemplate = Omit<CategoryDto, "id" | "productCount">;
const sourcedCovers: Record<string, string> = {"naruto": "naruto-uzumaki", "dragon-ball": "son-goku", "attack-on-titan": "eren-yeager", "demon-slayer": "tanjiro-kamado", "bleach": "ichigo-kurosaki", "hunter-x-hunter": "gon-freecss", "solo-leveling": "sung-jinwoo", "jujutsu-kaisen": "satoru-gojo", "blue-lock": "yoichi-isagi", "death-note": "light-yagami", "marvel": "spider-man", "dc": "batman", "movies": "harry-potter", "action-figures": "naruto-uzumaki", "keychains": "naruto-keychain", "katanas": "tanjiro-nichirin-sword", "t-shirts": "naruto-sasuke-shirt", "accessories": "konoha-pin"};
const cover = (slug: string) => `/images/sourced/${sourcedCovers[slug]}-1.webp`;
const rows: Array<[string, string, string, CategoryDto["kind"], CategoryDto["family"]]> = [
  ["Action Figures", "action-figures", "Anime, comic-book and movie-inspired figure collections.", "PRODUCT_TYPE", null],
  ["Keychains", "keychains", "Small accessories for your everyday fandom.", "PRODUCT_TYPE", null],
  ["Katanas", "katanas", "Explore decorative sword and display ideas.", "PRODUCT_TYPE", null],
  ["T-shirts", "t-shirts", "Wear your fandom in your own way.", "PRODUCT_TYPE", null],
  ["Accessories", "accessories", "Pins, charms and more collectible extras.", "PRODUCT_TYPE", null],
  ["One Piece", "one-piece", "Adventure without limits.", "FRANCHISE", "ANIME"],
  ["Naruto", "naruto", "The will to keep going.", "FRANCHISE", "ANIME"],
  ["Dragon Ball", "dragon-ball", "Beyond your limits.", "FRANCHISE", "ANIME"],
  ["Attack on Titan", "attack-on-titan", "A world beyond the walls.", "FRANCHISE", "ANIME"],
  ["Demon Slayer", "demon-slayer", "A spirit that never breaks.", "FRANCHISE", "ANIME"],
  ["Bleach", "bleach", "Discover another side of the spirit world.", "FRANCHISE", "ANIME"],
  ["Hunter × Hunter", "hunter-x-hunter", "Follow your next adventure.", "FRANCHISE", "ANIME"],
  ["Solo Leveling", "solo-leveling", "A new level of determination.", "FRANCHISE", "ANIME"],
  ["Jujutsu Kaisen", "jujutsu-kaisen", "Enter the extraordinary.", "FRANCHISE", "ANIME"],
  ["Blue Lock", "blue-lock", "Make every moment count.", "FRANCHISE", "ANIME"],
  ["Death Note", "death-note", "Explore a darker kind of story.", "FRANCHISE", "ANIME"],
  ["Marvel", "marvel", "Explore comic-book hero collections.", "FRANCHISE", "MARVEL"],
  ["DC", "dc", "Discover worlds of comic-book legends.", "FRANCHISE", "DC"],
  ["Movies & Cinema", "movies", "Stories from the screen, made part of your display.", "FRANCHISE", "MOVIES"],
  ["Other Collections", "other-collections", "Original fictional AI concepts — not for sale.", "FRANCHISE", "OTHER"],
];
export const storefrontTaxonomy: CategoryTemplate[] = rows.map(([name, slug, description, kind, family], index) => ({
  name, slug, description, kind, family, isActive: true, displayOrder: index,
  imageUrl: ["naruto", "attack-on-titan", "demon-slayer", "one-piece", "katanas", "keychains", "jujutsu-kaisen", "dragon-ball", "blue-lock"].includes(slug) ? `/images/collections/${slug}-cover.webp` : slug === "one-piece" ? "/images/figures/867155812_122155861425356138_1955209043147405711_n.jpg" : slug === "other-collections" ? "/images/concepts/celestial-wayfarer.webp" : cover(slug),
  imageIsDemo: slug === "other-collections",
}));
