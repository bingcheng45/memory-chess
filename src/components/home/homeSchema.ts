import {
  BRAND_ALTERNATE_NAMES,
  BRAND_AUTHOR,
  BRAND_DISAMBIGUATION,
  BRAND_ORGANIZATION,
  BRAND_WEBSITE,
  ORGANIZATION_ID,
  SCHEMA_IMAGES,
  socialImage,
  WEBSITE_ID,
} from "@/lib/seo/brand";
import { languageTag, localizedUrl } from "@/lib/seo/alternates";
import { TUTORIAL_VIDEO } from "@/components/ui/tutorialVideo";

/**
 * No aggregateRating, because the site has no rating data and an invented one breaks Google's policy.
 */
export function homeSchema(locale: string, description: string) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      BRAND_ORGANIZATION,
      BRAND_WEBSITE,
      BRAND_AUTHOR,
      {
        "@type": ["SoftwareApplication", "WebApplication"],
        "@id": `${localizedUrl("/", "en")}/#app`,
        name: "Memory Chess",
        alternateName: BRAND_ALTERNATE_NAMES,
        disambiguatingDescription: BRAND_DISAMBIGUATION,
        url: localizedUrl("/", locale),
        applicationCategory: "GameApplication",
        applicationSubCategory: "Chess memory trainer",
        operatingSystem: "Any (web browser)",
        browserRequirements: "Requires JavaScript",
        inLanguage: languageTag(locale),
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        publisher: { "@id": ORGANIZATION_ID },
        author: { "@id": BRAND_AUTHOR["@id"] },
        isPartOf: { "@id": WEBSITE_ID },
        description,
        image: SCHEMA_IMAGES,
        screenshot: socialImage.url,
      },
      {
        "@type": "VideoObject",
        "@id": `${localizedUrl("/", "en")}/#tutorial-video`,
        ...TUTORIAL_VIDEO,
        inLanguage: "en",
      },
    ],
  };
}
