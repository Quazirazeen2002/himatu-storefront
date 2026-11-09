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

## Homepage photo and navigation refinement — 9 November 2026

The homepage hero now uses four unchanged original HIMATU photographs as full-width cover images. Text remains in a consistent foreground layer with a restrained contrast overlay. Slides advance every six seconds, pause on hover/focus, and provide previous/next and play/pause controls. Manual navigation pauses autoplay. Reduced motion disables autoplay and crossfades.

The former universe editorial and “The stories stay with you” homepage sections were removed. A seamless linked collection marquee takes the second position. It pauses on hover/focus or via its control; reduced motion presents a manually scrollable collection rail. The duplicate visual loop is inert and hidden from assistive technology.

Storefront navigation uses `position: sticky; top: 0`, a translucent theme-aware tint and 16px backdrop blur. It overlays the homepage hero and retains its layout space elsewhere. The announcement strip is removed. The signed-in trigger shows a person icon with initials; account details remain available inside its existing dropdown.

Uploaded logos are preserved in `apps/web/public/images/brand/originals/`. Trimmed, lossless WebP derivatives provide white and black wordmarks and stacked footer signatures. Their CSS selection follows the existing persisted light/dark theme. Existing fonts, catalogue data, product photographs, auth rules and commerce state remain unchanged. Implementation uses existing React, Next Image, Lucide and CSS; no dependencies were added.

Validation: root build and typecheck passed; 77 web tests passed; edited TSX files passed ESLint. Full-project lint remains blocked by existing errors (19 API errors; 104 web errors and 168 warnings at the time of validation). Browser UI verification used a temporary isolated source copy with the auth proxy omitted and the session endpoint mocked; production authentication was not changed or bypassed. Both themes fit 320, 375, 390, 768, 1024 and 1440px without document overflow after layout settled. Slideshow autoplay/manual pause, marquee pause, sticky navigation, search filtering, bag opening, mobile navigation, Escape/focus restoration and compact profile dropdown were checked. This is UI verification, not live authentication or checkout certification.

Before/after screenshots: `output/playwright/home-refresh/`.

Reduced-motion QA also exposed an existing `Reveal` server/client initial-style mismatch. Its initial markup is now consistent; reduced-motion CSS makes content immediately visible and its reveal duration is zero.

## Collectible presentation refinement — 9 November 2026

Featured cards now use a dedicated purchase row with a 20px minimum gap, wrapping, touch-sized buttons and theme-aware colours. The carousel has corrected gap-aware sliding, accessible previous/next and pause controls, swipe support, offscreen focus exclusion and reduced-motion handling. Product descriptions and the gallery caption were rewritten around the visible character compositions; the “Illustrative price” and bag “Sample price” labels were removed.

A shared `pricing()` calculation drives the original/sale price display, savings, bag totals, checkout line totals and price filtering/sorting. The owner explicitly approved **15% off existing prices**. Original `price` values were retained, with discounts stored separately as `salePrice`. Eight existing database products were updated, with previous values saved under the ignored `output/price-backups/` directory. The local eight-item catalogue uses the same approved 15% fallback (`catalogueDiscountPercent` in `src/lib/config.ts`). Live admin-managed prices take precedence by matching catalogue IDs to product slugs, or exact names, and refresh on window focus.

To change a live discount, open **Admin → Products → Edit**, retain Original Price, set a lower Sale Price, and save. Clear Sale Price to remove the offer; the update now sends `null`, fixing the previous inability to remove a discount. Both UI and API reject sale prices that are not positive and lower than the original price. No artificial higher comparison prices were created. No new coupon or payment logic was introduced. The existing Zoro Chibi catalogue entry has no matching database row, while Demon Slayer Hashira exists only in the backend; no inventory was invented to reconcile this pre-existing difference.

Below featured collectibles, `BrandStory` animates the supplied logo with scroll-driven scale, rotation, vertical motion and a progress rule. Reduced motion keeps the mark static. `MakingOf` closes the homepage with a four-chapter animated process visualization: Sculpt, Print, Finish and Display. It supports chapter selection, play/pause, viewport-aware playback and reduced motion. It is explicitly a stylized AI concept visualization. Real video generation was attempted through Higgsfield but rejected because the connected account requires a Plus plan or higher; no generated video file is claimed.

Four additional original fictional AI concepts were generated with the built-in image-generation tool: Ember Vanguard, Tidebound Oracle, Ironwood Ranger and Lunar Mechanist. They are stored as optimized 1086×1448 WebP files under `apps/web/public/images/concepts/` (126–203KB each). Full prompts and provenance are in `refinement-provenance.json`. They appear in the concept lab and catalogue, with meaningful alt text and the explicit “AI-GENERATED CONCEPT — NOT FOR SALE” label. They have no prices, stock claims or purchase controls; wishlist saving remains available. Original HIMATU photographs are unchanged.

Validation: root production build and typecheck passed. API tests: 63 passed, one database integration test skipped because `TEST_DATABASE_URL` was not configured. Web tests: 89 passed, including original-price preservation, invalid-discount handling, 15% calculation, totals, sale-aware filtering/sorting and expanded concept pagination. New UI/pricing components pass targeted ESLint. Full-project lint still reports pre-existing errors (19 API errors; 103 web errors at the final full lint run). Browser QA used an isolated local source copy with its auth proxy omitted; session responses were fixtures. Live API pricing was also forwarded into that preview for real sale-total verification. This does not certify live authentication or payment processing. Evidence is in `output/playwright/collection-refinement/`.

Final browser sweep: 72 route/theme/width combinations passed without document horizontal overflow after correcting catalogue toolbar intrinsic sizing and the 320px checkout grid. The running local API returned the saved discounts; a bag and checkout subtotal of ৳5,525 for one Luffy Gear Five matched its retained ৳6,500 original price. Making-of autoplay, pause, manual chapters and reduced-motion behavior passed. Production authentication was unchanged.

## HIMATU six-letter scroll story — 9 November 2026

The former two-point brand section is replaced by six chapters: **Heroes, Imagination, Memories, Artistry, Treasures and Universe**. `apps/web/src/lib/brand-story.ts` holds the narrative and photographic-detail descriptions. The chapter paragraphs contain 641 words. This is a new brand interpretation, not a claim about the historical origin of the name.

`BrandStory.tsx` owns the section and its local interaction state; `himatu-story.css` scopes the presentation. The existing supplied logos, original figure photographs, original AI concept imagery, local typography and both themes are retained. No catalogue, pricing, bag, wishlist, authentication or API contracts were changed for this story.

### Motion responsibilities

- GSAP 3.15.1 and ScrollTrigger control the pinned desktop visual stage, individual HIMATU letters, staggered chapter-title characters, reversible photographic transitions, restrained photo scale, progress line and reunited closing word.
- Existing Framer Motion controls chapter-link feedback, the active navigation marker, photographic-detail zoom and single/grouped photographic arrangement. GSAP and Motion operate on different elements.
- Desktop enhancement requires at least 1100px width and 700px height with normal motion preference. GSAP is imported when the story approaches within 900px of the viewport. Data Saver and devices reporting two or fewer hardware threads retain the static layout. No wheel interception, forced scroll or automatic snapping is used.
- `gsap.matchMedia()` reverts its timelines, triggers and pin wrapper on breakpoint changes or unmount. Load listeners are removed. GSAP-owned inline reveal properties are explicitly cleared, with static CSS overrides to guarantee readable headings after a preference change or an unavailable motion engine.

### Interactions and accessibility

Six native, labelled chapter anchors support keyboard navigation and shareable hashes. The active step follows the visible narrative. Desktop scenes exclude inactive controls from focus and the accessibility tree. On smaller or short screens, the visual studies appear inline with each chapter. Reduced motion disables pinning and scroll transforms while retaining the complete text and functional controls.

Artistry provides three labelled zoom positions within one original photograph; these are not additional angles or a 3D scan. Treasures switches between one and two photographic panels, explicitly without implying accurate physical scale. Universe updates the final collection destination from the existing collection list; the preference lives only in component state and is not added to account data or storage. The official Facebook link uses the supplied page URL. The unrelated website domain visible on Facebook was not introduced into the storefront.

### Validation and evidence

Root build passed, followed by a final web production build and root typecheck. Existing tests passed: 63 API and 89 web tests (152 total); one database integration test remained skipped without a configured test database. The new component and data module pass targeted ESLint. Repository-wide lint retains existing failures (19 API errors; 103 web errors).

Browser checks covered 320, 375, 390, 768, 1024 and 1440px, both themes and normal/reduced motion: 24 combinations passed with no document overflow or clipped active heading. Detail controls, arrangement switching, chapter keyboard activation and a Naruto selection updating the final link passed. Three repeated client-side shop/home navigation cycles each left exactly one pin on the enhanced homepage and none on the shop. Resizing or enabling reduced motion removed the pin. Final normal and reduced-motion reloads recorded no new console errors.

Visual QA used an isolated local source copy with the auth proxy omitted and account/catalogue/analytics responses mocked. It tests the actual UI without bypassing or changing production authentication; it does not certify live payment or account flows. Evidence: `output/playwright/himatu-story/`, including before/after desktop/mobile screenshots and `scroll-demo.mp4`, a roughly 20-second real browser recording.

## Category presentation — 9 November 2026

Product-type galleries and franchise galleries share consistent portrait covers, clear headings, discreet arrow links and restrained hover movement. Product categories use three desktop columns, family entry cards use four, and narrow layouts use two. Existing theme tokens, typography and reduced-motion safeguards remain in use. Header category and collection dropdowns read the live registry; mobile navigation and homepage category cards use the same destinations.

Eighteen original AI-generated demo covers are optimized as 960 × 1200 WebP files in `apps/web/public/images/categories/`. Generation prompts and provenance are recorded in that directory's `provenance.json`. These are illustrative genre/category studies, not licensed character photography or confirmed stock. They display Demo Artwork labels. One Piece retains genuine supplied HIMATU photography; Other Collections uses an existing concept image. Original product photographs were preserved. A code-authored neutral SVG provides the fallback for future entries with no cover.

The applied Prisma migration adds category kind, franchise family, cover provenance and a nullable independent product-type relation. Existing franchise relationships and original prices remain intact. The public API excludes hidden categories; admin listing includes them. Uploaded category covers use the existing storage service's image validation and public image bucket, with orphan cleanup if saving the category fails.

## Original-photo storefront refinement — 9 November 2026

The HIMATU story now uses letter-led visual stages with no photographic companion panels. Its scroll choreography, chapter navigation, responsive fallback and reduced-motion behavior remain. Hero photography has restrained drift and automatic transitions; the featured rail advances automatically with pause controls. The concept-lab homepage section was removed, and the making-of visualization uses an original supplied Zoro photograph.

Product detail leads use responsive 19–25px Inter with a clear character-name block, compact metadata and expandable provenance. Source reference cards place enquiry text below the title to avoid price/title collisions. The shop maintains nine-item pagination and three desktop columns. Quick-view dialogs and a mobile shopping dock reuse existing bag, wishlist and modal behavior.

See `original-photography-and-whatsapp.md` for sourcing, catalogue and checkout boundaries. No generated artwork replaces the new source photographs; the original seven uploaded figure photos remain unchanged.
