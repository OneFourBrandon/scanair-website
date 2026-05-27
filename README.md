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

The site is a Vite build served by a Cloudflare Worker so `/api/contact` can send contact form messages securely.

## Contact Form Email

The contact form posts to `/api/contact`. The Worker sends the message through Brevo's transactional email API and sets `replyTo` to the website visitor, so replies from the ScanAir inbox go back to the person who submitted the form.

Before deploying, create a Brevo API key and add it as a Cloudflare secret:

```bash
npx wrangler secret put BREVO_API_KEY
```

`CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`, and `CONTACT_FROM_NAME` are configured in `wrangler.jsonc`. The `CONTACT_FROM_EMAIL` address must be a verified Brevo sender or a sender on a verified Brevo domain.

For local Worker testing, create `.dev.vars`:

```ini
BREVO_API_KEY=your-brevo-api-key
```

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
