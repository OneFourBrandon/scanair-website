export type Listing = {
  slug: string;
  title: string;
  location: string;
  status: string;
  splatSrc: string;
  fallbackSrc: string;
  fallbackAlt: string;
  description: string;
  details: string[];
  realtorCtaLabel?: string;
  realtorCtaHref?: string;
};

export const listings: Listing[] = [
  {
    slug: "1-lakeview",
    title: "1 Lakeview Drive",
    location: "North Bay, Ontario, P1C 1C7",
    status: "For Sale (Example)",
    splatSrc: "https://superspl.at/s?id=f0aa37f0",
    fallbackSrc: "/assets/samples/residential_fallback.png",
    fallbackAlt: "1 Lakeview 3D Gaussian splat preview",
    description:
      "An example real estate 3DGS listing that can be packaged into a realtor landing page, property microsite, or client-facing showcase.",
    details: ["Interactive 3D Gaussian scene", "Web preview fallback image", "Designed for property marketing pages"],
    realtorCtaLabel: "Connect With Realtor",
    realtorCtaHref: "/contact",
  },
];

export const listingDefaults = {
  categoryTitle: "Listings",
  categoryDescription:
    "Property-focused 3DGS demos built as reusable listing pages. Add a new listing entry and the category page, detail page, navigation, and build routes stay in sync.",
  detailEyebrow: "Interactive property scan",
};

export const findListingBySlug = (slug: string) => listings.find((listing) => listing.slug === slug);
