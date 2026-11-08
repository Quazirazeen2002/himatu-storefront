# HIMATU design system

Updated 8 November 2026 (Asia/Dhaka), Stage 2.5 customer experience.

## Direction and typography

The current bold editorial direction supersedes the earlier serif-led system. The existing Next.js architecture, original photographs, interaction patterns and light/dark preference control remain.

All active fonts are self-hosted through `next/font/local`, with `font-display: swap`, original WOFF2 distributions and adjacent SIL Open Font License notices in `apps/web/src/app/fonts/`.

- Barlow Condensed ExtraBold Italic (800): homepage hero, campaign storytelling, large page headings, brand statement and the HIMATU watermark. Barlow Condensed Bold (700, normal): section and collection headings. Display headings use controlled uppercase and tight tracking around -0.015 to -0.02em.
- Inter variable: body and descriptions 500, navigation 600, buttons and product titles 700, wordmark 800. Product detail headings retain Inter for readable names. Paragraphs preserve comfortable line height and contrast with display typography.
- Geist Mono variable, regular 400: prices, identifiers, technical labels, eyebrows and availability disclosures.

`--font-editorial`, `--font-ui` and `--font-metadata` map these roles in `apps/web/src/lib/tokens.css`. Responsive `clamp()` scales the desktop hero from 56 to 104px; mobile uses 42 to 72px. General page headlines scale 48–96px, section headings 32–56px and product detail names 30–48px. Breakpoint-specific rules prevent long titles from overflowing.

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

The hero pairs the original HIMATU action photograph with an oversized two-line headline and an EXPLORE COLLECTIONS primary CTA and SHOP ALL FIGURES secondary CTA. The full HIMATU watermark replaces COLLECT.; it is decorative, aria-hidden and very low opacity. The homepage proceeds through franchise discovery, featured original photographs, a neutral One Piece collection story, custom printing and the three-line DISCOVER. COLLECT. DISPLAY. statement. Unsupported new-arrival and bestseller claims are absent.

Cards use consistent 3:4 image stages, readable Inter names, restrained hover motion and no heavy card border. Desktop catalogue grids have three columns, tablet/mobile two where space requires it. Original photographs retain their natural color, full aspect ratio and local sources; their bytes are unchanged. Missing franchise photography is disclosed rather than filled with unrelated imagery.

Three original AI concepts have separate local WebP files and meaningful alt text. Their cards, details, galleries and collection context disclose their origin. Each is labelled **AI-GENERATED CONCEPT — NOT FOR SALE**. They have no price, stock, specifications or purchase controls. Their wishlist action is available for saving visual inspiration. Provenance and exact generation prompts live in `public/images/concepts/provenance.json`.

## Implementation and accessibility

`globals.css` preserves the responsive foundation; `theme.css` supplies shared palette treatments; `refinement.css` defines the current typography, editorial presentation, card and pagination refinements. Navigation stays one level deep, with a simple collection dropdown, mobile dialog, search, account, wishlist, visible bag count and theme toggle.

Existing modal focus behavior, semantic buttons, native disabled states, live catalogue counts, keyboard focus and reduced-motion handling remain. Pagination uses a labelled navigation landmark and `aria-current="page"`. Validation is local only; no production commerce services were added.

## Stage 2.5 landing and authentication

`apps/web/src/app/customer-experience.css` adds scoped landing and customer-auth layouts after the existing theme/refinement layers. The landing signature is the original action photograph beside condensed campaign type and a subtle HIMATU watermark. One Piece receives a large photographic collection feature; other existing franchise destinations remain clearly labelled previews while their photographs are unavailable. Unsupported imagery, inventory and launch claims are not fabricated. Homepage cards intentionally omit unverified sample prices and stock metadata; catalogue/cart demonstration values remain unchanged. A neutral featured-collection story replaces unsupported new-arrival claims.

Sign-in and registration share a photo-led editorial left panel and a quiet form panel on desktop. Below 768px the form appears first and the photograph follows, preserving visual and keyboard order. Barlow 800 italic headlines, Inter labels/body and Geist captions reuse the active local fonts. No new font or animation library was added. Dark/white preference remains available.

Customer forms use 52px controls, visible labels, associated error/hint text, a first-error focus target, native disabled fields and an aria-busy form during validation. Password visibility buttons have accessible names, aria-pressed and 44px targets. Matching confirmation, required fields, email format and registration password length are checked locally. Sign-in includes a clearly labelled remember-me preference preview and a real recovery route. Red is a small marker, while error text uses readable foreground color.

Hover zoom, navigation underline and password-icon transitions are restrained and disable with reduced-motion preferences. Existing section reveals and modal focus behavior remain. No supported browser transition API or dependency was enabled merely to animate route changes.

`auth-service.ts` defines the unconnected Stage 3 adapter boundary. The interface never claims operational authentication; explicit notices precede each form and responses remain signed out. Password values exist transiently in form memory and clear after a service response. They are never persisted, logged or sent by this adapter. See the Stage 2.5 completion report for contract details and screenshots.

### Landing-page sign-in placement

The landing hero includes a visible outlined SIGN IN action beside collection discovery. The top-right account icon has been removed globally. Mobile navigation retains its Sign in link. Shopping discovery remains the primary hero action.

## Stage 3 authentication integration

The signed-out visual design remains. Auth forms now call same-origin server handlers and show provider errors/verification feedback. Verified sessions expose MY ACCOUNT through landing/mobile navigation; the account page loads and edits the protected customer profile. Tokens remain HTTP-only cookies. The top-right account icon remains removed. Commerce is still a demonstration. Source now lives in apps/web after the documented workspace migration.
