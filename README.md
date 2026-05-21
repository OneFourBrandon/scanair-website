# ScanAir Website

Marketing landing page for `scanair.ca`.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The site is a Vite static build. Deploy the `dist/` output to Cloudflare, Netlify, or another static host.

## Docker

```bash
docker build -t scanair-website .
docker run --rm -p 8080:80 scanair-website
```

Then open `http://localhost:8080`.

## Assets

- `public/assets/scanair-logo-red.png` comes from `C:\Users\devil\Desktop\ScanAir\Graphics\Export\1024w\Asset 4.png`.
- `public/assets/hero-property-scan.png` comes from the generated ScanAir landing page hero concept.

## Samples

The homepage Samples section is ready for SuperSplat embeds. Add a shared SuperSplat viewer URL to a sample card's `data-supersplat-src` value in `index.html`; the page lazy-loads the iframe when the section nears the viewport.

## Palette

- Oxblood red: `#5B0F14`
- Graphite charcoal: `#1F2328`
- Warm concrete: `#B7B4AD`
- Scan blue: `#2C6A8F`
- Cloud white: `#F3F2EF`
- Natural cedar: `#A98263`
