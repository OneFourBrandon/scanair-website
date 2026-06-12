import { findListingBySlug } from "../data/listings";

const slugFromPath = () => {
  const parts = window.location.pathname.split("/").filter(Boolean);
  const listingIndex = parts.indexOf("listings");

  return listingIndex >= 0 ? parts[listingIndex + 1] || "" : "";
};

const listing = findListingBySlug(slugFromPath());
const mount = document.querySelector<HTMLElement>("[data-listing-detail]");

if (listing && mount) {
  const realtorCtaLabel = listing.realtorCtaLabel || "Connect With Realtor";
  const realtorCtaHref = listing.realtorCtaHref || "/contact";

  document.title = `${listing.title} | ScanAir Listings`;

  const descriptionMeta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  descriptionMeta?.setAttribute("content", listing.description);

  const ogTitle = document.querySelector<HTMLMetaElement>('meta[property="og:title"]');
  ogTitle?.setAttribute("content", `${listing.title} | ScanAir Listings`);

  const ogDescription = document.querySelector<HTMLMetaElement>('meta[property="og:description"]');
  ogDescription?.setAttribute("content", listing.description);

  const ogImage = document.querySelector<HTMLMetaElement>('meta[property="og:image"]');
  ogImage?.setAttribute("content", listing.fallbackSrc);

  const listingHeroMarkup = `
    <section class="listing-hero listing-hero-after-viewer" data-listing-hero aria-labelledby="listing-title">
      <div class="shell listing-hero-shell" data-listing-hero-shell>
        <div class="listing-hero-copy">
          <h1 id="listing-title">${listing.title}</h1>
          <p>${listing.description}</p>
          <div class="listing-hero-actions">
            <a class="button button-primary button-large" href="${realtorCtaHref}">
              ${realtorCtaLabel}
              <span aria-hidden="true">&rarr;</span>
            </a>
            <a class="button button-ghost button-large" href="/listings">All Listings</a>
          </div>
        </div>
        <dl class="listing-facts" aria-label="Listing details">
          <div>
            <dt>Location</dt>
            <dd>${listing.location}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>${listing.status}</dd>
          </div>
          ${listing.details
            .map(
              (detail) => `
                <div>
                  <dt>Included</dt>
                  <dd>${detail}</dd>
                </div>
              `,
            )
            .join("")}
        </dl>
      </div>
    </section>`;

  mount.innerHTML = `
    <section class="band band-dark listing-viewer-section" id="viewer" aria-label="${listing.title} interactive 3D viewer">
      <div class="shell listing-viewer-shell">
        <div
          class="listing-viewer viewer supersplat-embed"
          data-supersplat-embed
          data-supersplat-src="${listing.splatSrc}"
          data-supersplat-ui="true"
          data-supersplat-fallback="${listing.fallbackSrc}"
          data-supersplat-fallback-alt="${listing.fallbackAlt}"
          data-supersplat-title="${listing.title} SuperSplat viewer"
          aria-label="${listing.title} SuperSplat viewer"
        >
          <div class="sample-placeholder">
            <img class="sample-fallback-image" src="${listing.fallbackSrc}" alt="${listing.fallbackAlt}" loading="eager" decoding="async" />
          </div>
        </div>
      </div>
    </section>
    ${listingHeroMarkup}
    <section class="band band-paper listing-cta" aria-labelledby="listing-cta-title">
      <div class="shell cta-strip">
        <div class="cta-strip-text">
          <strong id="listing-cta-title">Want this on a realtor or property website?</strong>
          <p>ScanAir can package a 3DGS property viewer into a branded listing page or embed-ready marketing demo.</p>
        </div>
        <a class="button button-primary" href="/contact">
          Contact ScanAir
          <span aria-hidden="true">&rarr;</span>
        </a>
      </div>
    </section>
  `;
} else if (mount) {
  document.title = "Listing Not Found | ScanAir";
  mount.innerHTML = `
    <section class="listing-hero" aria-labelledby="listing-title">
      <div class="shell listing-hero-shell">
        <div class="listing-hero-copy">
          <p class="eyebrow">Listing unavailable</p>
          <h1 id="listing-title">This listing is not available.</h1>
          <p>The property scan you requested could not be found. It may have moved, expired, or not been published yet.</p>
          <div class="listing-hero-actions">
            <a class="button button-primary button-large" href="/listings">View Listings</a>
            <a class="button button-ghost button-large" href="/contact">Contact Us</a>
          </div>
        </div>
      </div>
    </section>
  `;
}

export {};
