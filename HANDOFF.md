# Codex Handoff

## Goal

Continue the main ScanAir marketing website in `C:\Users\devil\Desktop\ScanAir\scanair-website`.

The first pass recreates the generated landing-page concept as a real static Vite site. It uses the red ScanAir logo and the red/graphite/concrete/scan-blue palette from the provided board.

## Current State

- Stack: Vite static site, plain HTML and CSS.
- Entry: `index.html`.
- Styles: `src/styles.css`.
- Assets:
  - `public/assets/scanair-logo-red.png`
  - `public/assets/hero-property-scan.png`
- Primary CTA routes to `https://path.scanair.ca`.
- Navigation anchors are local page sections.
- No framework is currently required.

## Visual Direction

Use a professional contractor-facing SaaS style:

- Premium, architectural, and practical.
- Full-bleed hero image with copy over the image, not a split media/text layout.
- Oxblood red for the main brand accent and CTAs.
- Graphite for nav/footer/deep panels.
- Warm concrete and cloud white for content surfaces.
- Scan blue only for technical scan/reconstruction accents.
- Keep corners tight, 4px to 8px.
- Avoid playful styling, decorative blobs, generic gradients, and marketing fluff.

## Important Links

- App CTA: `https://path.scanair.ca`
- Main domain target: `https://scanair.ca`

## Next Work

1. Replace placeholder marketing copy with final positioning.
2. Add real pricing once tiers are final.
3. Add a privacy/terms footer once public legal pages are decided.
4. Add responsive QA screenshots for desktop, tablet, and mobile.
5. Add deployment config for Cloudflare once the repo is connected.
6. Consider adding a tiny JS module only if needed for menus or analytics.

## Verification

Run:

```bash
npm install
npm run build
npm run dev
```

Then open the local Vite URL.
