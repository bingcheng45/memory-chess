import type { Metadata } from "next";

const SITE_URL = "https://thememorychess.com";
const BRAND_NAME = "Memory Chess";
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

// Social preview artwork, built from the launch artwork by
// scripts/build-social-images.mjs. Served as static files from /public rather
// than a dynamic `opengraph-image` route: X's card crawler is noticeably more
// reliable against a plain image with no query string and no Next.js `Vary`
// headers. The folder matches OUT_DIR in that script.
const SOCIAL_IMAGE_URL = (size: string) => `${SITE_URL}/social/v2/memory-chess-${size}.jpg`;

export const socialImage = {
  url: SOCIAL_IMAGE_URL("1200x630"),
  width: 1200,
  height: 630,
  type: "image/jpeg",
  alt: "Memory Chess: how many chess pieces can you remember? A chess position to study, then rebuild from memory.",
};

/** 16:9, 4:3 and 1:1 crops, the set Google asks for in structured data. */
export const SCHEMA_IMAGES = ["1200x630", "1200x900", "1200x1200"].map(SOCIAL_IMAGE_URL);

/** Open Graph and X card fields for a page that shares the site artwork. */
export function socialMetadata({ title, description, url }: { title: string; description: string; url: string }) {
  return {
    openGraph: { title, description, url, images: [socialImage] },
    twitter: { card: "summary_large_image", title, description, images: [socialImage] },
  } satisfies Pick<Metadata, "openGraph" | "twitter">;
}

export function titleNamingBrandOnce(title: string): Metadata["title"] {
  return title.includes(BRAND_NAME) ? { absolute: title } : title;
}

const ALTERNATE_NAMES = ["MemoryChess", "The Memory Chess"];

export const BRAND_ORGANIZATION = {
  "@type": "Organization",
  "@id": ORGANIZATION_ID,
  name: BRAND_NAME,
  alternateName: ALTERNATE_NAMES,
  // The English home meta description; a test keeps the two in step.
  description:
    "Play the free memory chess game online. Study a chess position for a few seconds, rebuild it from memory, and get an instant accuracy score. No sign-up.",
  url: SITE_URL,
  logo: `${SITE_URL}/logo-512.png`,
  sameAs: ["https://x.com/TheMemoryChess"],
} as const;

export const BRAND_WEBSITE = {
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  name: BRAND_NAME,
  alternateName: ALTERNATE_NAMES,
  url: SITE_URL,
  publisher: { "@id": ORGANIZATION_ID },
} as const;
