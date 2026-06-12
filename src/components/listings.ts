import { listings } from "../data/listings";

const mount = document.querySelector<HTMLElement>("[data-listings-grid]");

const iconMarkup = `
  <span class="listing-card-icon" aria-hidden="true">
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M16 4 28 10.5v11L16 28 4 21.5v-11L16 4Z" />
      <path d="M4 10.5 16 17l12-6.5" />
      <path d="M16 17v11" />
    </svg>
  </span>
`;

if (mount) {
  mount.innerHTML = listings
    .map(
      (listing, index) => `
        <article class="listing-card reveal">
          <a class="listing-card-media" href="/listings/${listing.slug}" aria-label="View ${listing.title}">
            <img src="${listing.fallbackSrc}" alt="${listing.fallbackAlt}" loading="lazy" decoding="async" />
            ${iconMarkup}
          </a>
          <div class="listing-card-body">
            <span class="listing-card-index">${String(index + 1).padStart(2, "0")}</span>
            <div>
              <p class="listing-card-kicker">${listing.status}</p>
              <h2>${listing.title}</h2>
              <p>${listing.description}</p>
              <a class="text-arrow" href="/listings/${listing.slug}">
                View listing
                <span aria-hidden="true">&rarr;</span>
              </a>
            </div>
          </div>
        </article>
      `,
    )
    .join("");
}

export {};
