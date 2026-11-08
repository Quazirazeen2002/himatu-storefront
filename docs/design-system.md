# HIMATU design system

Updated 8 November 2026 (Asia/Dhaka), Stage 2 visual refinement.

## Direction and typography

The current bold editorial direction supersedes the earlier serif-led system. The existing Next.js architecture, original photographs, interaction patterns and light/dark preference control remain.

All active fonts are self-hosted through `next/font/local`, with `font-display: swap`, original WOFF2 distributions and adjacent SIL Open Font License notices in `src/app/fonts/`.

- Barlow Condensed ExtraBold Italic (800): homepage hero, campaign storytelling, large page headings, brand statement and the HIMATU watermark. Barlow Condensed Bold (700, normal): section and collection headings. Display headings use controlled uppercase and tight tracking around -0.015 to -0.02em.
- Inter variable: body and descriptions 500, navigation 600, buttons and product titles 700, wordmark 800. Product detail headings retain Inter for readable names. Paragraphs preserve comfortable line height and contrast with display typography.
- Geist Mono variable, regular 400: prices, identifiers, technical labels, eyebrows and availability disclosures.

`--font-editorial`, `--font-ui` and `--font-metadata` map these roles in `src/lib/tokens.css`. Responsive `clamp()` scales the desktop hero from 56 to 104px; mobile uses 42 to 72px. General page headlines scale 48–96px, section headings 32–56px and product detail names 30–48px. Breakpoint-specific rules prevent long titles from overflowing.

Sources: `@fontsource/barlow-condensed@5.3.0`, `@fontsource-variable/inter@5.3.0`, and the existing `@fontsource-variable/geist-mono@5.3.0`. Distribution pages: [Barlow Condensed](https://fontsource.org/fonts/barlow-condensed), [Inter](https://fontsource.org/fonts/inter), [Geist Mono](https://fontsource.org/fonts/geist-mono). No proprietary brand font is used. Historical Figtree/Source Serif assets remain archived locally but are no longer loaded.

## Palette

The dark default uses these centralized tokens:

- Background #000000; surface #0A0A0A; elevated surface #111111.
- Border #262626; foreground #FFFFFF; secondary #A0A0A0; muted #737373.
- Accent #D92727 for restrained markers, selected navigation and error indicators.
- Primary CTA #FFFFFF with #000000 text; secondary actions transparent with an outline.

Small ordinary supporting text uses secondary, not muted. Secondary on elevated surface has approximately 7.22:1 contrast; white/black buttons have 21:1. Muted is reserved for disabled/decorative content and stronger control boundaries. Focus-visible uses a 2px foreground outline with 4px offset. Inputs and dialogs use consistent surface, border and disabled states. No glow, blur-heavy glass or decorative gradient is introduced.

The header sun/moon control retains both palettes. Light uses white background, #F5F5F5 surface, #EEEEEE elevated, #111111 foreground, #595959 secondary and black primary CTAs. `himatu-theme` persists the choice, restored by the existing pre-paint bootstrap. Storage failure still permits session switching.

## Composition and photography

The hero pairs the original HIMATU action photograph with an oversized two-line headline and a direct SHOP NOW CTA. The full HIMATU watermark replaces COLLECT.; it is decorative, aria-hidden and very low opacity. The homepage proceeds through featured original photographs, franchise discovery, custom printing and DISCOVER. COLLECT. DISPLAY. Unsupported new-arrival and bestseller claims are absent.

Cards use consistent 3:4 image stages, readable Inter names, restrained hover motion and no heavy card border. Desktop catalogue grids have three columns, tablet/mobile two where space requires it. Original photographs retain their natural color, full aspect ratio and local sources; their bytes are unchanged. Missing franchise photography is disclosed rather than filled with unrelated imagery.

Three original AI concepts have separate local WebP files and meaningful alt text. Their cards, details, galleries and collection context disclose their origin. Each is labelled **AI-GENERATED CONCEPT — NOT FOR SALE**. They have no price, stock, specifications or purchase controls. Their wishlist action is available for saving visual inspiration. Provenance and exact generation prompts live in `public/images/concepts/provenance.json`.

## Implementation and accessibility

`globals.css` preserves the responsive foundation; `theme.css` supplies shared palette treatments; `refinement.css` defines the current typography, editorial presentation, card and pagination refinements. Navigation stays one level deep, with a simple collection dropdown, mobile dialog, search, account, wishlist, visible bag count and theme toggle.

Existing modal focus behavior, semantic buttons, native disabled states, live catalogue counts, keyboard focus and reduced-motion handling remain. Pagination uses a labelled navigation landmark and `aria-current="page"`. Validation is local only; no production commerce services were added.
