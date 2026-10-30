import { languageTag, localizedUrl } from "@/lib/seo/alternates";
import { ORGANIZATION_ID, SCHEMA_IMAGES, WEBSITE_ID } from "@/lib/seo/brand";

/** A page that is itself something to play in the browser, free. */
export function webApplicationNode({ path, locale, name, description }: { path: string; locale: string; name: string; description: string }) {
  const url = localizedUrl(path, locale);
  return {
    "@type": "WebApplication",
    "@id": `${url}#app`,
    name,
    url,
    description,
    applicationCategory: "GameApplication",
    operatingSystem: "Any (web browser)",
    browserRequirements: "Requires JavaScript",
    inLanguage: languageTag(locale),
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    publisher: { "@id": ORGANIZATION_ID },
    isPartOf: { "@id": WEBSITE_ID },
    image: SCHEMA_IMAGES,
  };
}
