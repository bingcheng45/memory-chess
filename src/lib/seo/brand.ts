const SITE_URL = "https://thememorychess.com";
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

export const BRAND_ORGANIZATION = {
  "@type": "Organization",
  "@id": ORGANIZATION_ID,
  name: "Memory Chess",
  alternateName: ["MemoryChess", "The Memory Chess"],
  url: SITE_URL,
  logo: `${SITE_URL}/logo-512.png`,
  sameAs: ["https://x.com/TheMemoryChess"],
} as const;

export const BRAND_WEBSITE = {
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  name: "Memory Chess",
  url: SITE_URL,
  publisher: { "@id": ORGANIZATION_ID },
} as const;
