import { BRAND_ORGANIZATION, BRAND_WEBSITE, ORGANIZATION_ID, WEBSITE_ID } from "@/lib/seo/brand";
import { languageTag, localizedUrl } from "@/lib/seo/alternates";

/**
 * Home structured data: the brand graph plus the app itself. No aggregateRating,
 * because the site has no rating data and an invented one breaks Google's policy.
 */
export function homeSchema(locale: string, description: string) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      BRAND_ORGANIZATION,
      BRAND_WEBSITE,
      {
        "@type": ["SoftwareApplication", "WebApplication"],
        "@id": `${localizedUrl("/", "en")}/#app`,
        name: "Memory Chess",
        url: localizedUrl("/", locale),
        applicationCategory: "GameApplication",
        applicationSubCategory: "Chess memory trainer",
        operatingSystem: "Any (web browser)",
        browserRequirements: "Requires JavaScript",
        inLanguage: languageTag(locale),
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        publisher: { "@id": ORGANIZATION_ID },
        isPartOf: { "@id": WEBSITE_ID },
        description,
      },
    ],
  };
}
