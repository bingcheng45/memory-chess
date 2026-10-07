import type { Metadata } from "next";

const SITE_URL = "https://thememorychess.com";
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

// Social preview artwork. Served as a static file from /public rather than a
// dynamic `opengraph-image` route: X's card crawler is noticeably more reliable
// against a plain PNG with no query string and no Next.js `Vary` headers.
export const socialImage = {
  url: `${SITE_URL}/social-preview.png`,
  width: 1200,
  height: 630,
  type: "image/png",
  alt: "Memory Chess knight and brain logo — thememorychess.com",
};

/** Open Graph and X card fields for a page that shares the site artwork. */
export function socialMetadata({ title, description, url }: { title: string; description: string; url: string }) {
  return {
    openGraph: { title, description, url, images: [socialImage] },
    twitter: { card: "summary_large_image", title, description, images: [socialImage] },
  } satisfies Pick<Metadata, "openGraph" | "twitter">;
}

const ALTERNATE_NAMES = ["MemoryChess", "The Memory Chess"];

export const BRAND_ORGANIZATION = {
  "@type": "Organization",
  "@id": ORGANIZATION_ID,
  name: "Memory Chess",
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
  name: "Memory Chess",
  alternateName: ALTERNATE_NAMES,
  url: SITE_URL,
  publisher: { "@id": ORGANIZATION_ID },
} as const;
