# Self-hosted open-source fonts

Original, unmodified Latin variable WOFF2 files downloaded from Fontsource npm distributions on 7 November 2026:

- Figtree: `@fontsource-variable/figtree@5.3.0`, upstream https://github.com/erikdkennedy/figtree — UI/body, weights 400–800 used.
- Source Serif 4: `@fontsource-variable/source-serif-4@5.3.1`, upstream https://github.com/adobe-fonts/source-serif — editorial headings at regular 400; standard variable file includes optical sizing.
- Geist Mono: `@fontsource-variable/geist-mono@5.3.0`, upstream https://github.com/vercel/geist-font — metadata, regular 400.

Each is distributed under SIL Open Font License 1.1. Full original licenses/copyright notices are retained in the adjacent OFL text files. Fontsource source pages: https://fontsource.org/fonts/figtree/about, https://fontsource.org/fonts/source-serif-4/about, https://fontsource.org/fonts/geist-mono/about.

Loaded through `next/font/local`, served by the application with font-display swap. No runtime third-party font requests, proprietary Anthropic font files, or font modifications. System fallbacks cover glyphs outside the Latin subset, including the BDT currency symbol where needed.

## Active Stage 2 refinement fonts — 8 November 2026

- Barlow Condensed: `@fontsource/barlow-condensed@5.3.0`, Latin 700 normal and 800 italic. Upstream https://github.com/jpt/barlow. Original license: `BARLOW-CONDENSED-OFL.txt`.
- Inter: `@fontsource-variable/inter@5.3.0`, Latin normal weight variable. Upstream https://github.com/rsms/inter. Original license: `INTER-OFL.txt`.
- Geist Mono remains active for metadata.

These unmodified Fontsource WOFF2 assets are SIL OFL 1.1 licensed and served locally. Figtree and Source Serif 4 above document the historical system and are no longer loaded by layout.tsx. No runtime font dependency was added.
