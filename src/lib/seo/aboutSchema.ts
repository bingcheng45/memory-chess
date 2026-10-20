import { languageTag, localizedUrl } from "@/lib/seo/alternates";
import { BRAND_AUTHOR, BRAND_ORGANIZATION, BRAND_WEBSITE, ORGANIZATION_ID, WEBSITE_ID } from "@/lib/seo/brand";

export function aboutSchema(locale: string, title: string) {
  const url = localizedUrl("/about", locale);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "AboutPage",
        "@id": `${url}#webpage`,
        url,
        name: title,
        inLanguage: languageTag(locale),
        isPartOf: { "@id": WEBSITE_ID },
        about: { "@id": ORGANIZATION_ID },
        mainEntity: { "@id": BRAND_AUTHOR["@id"] },
      },
      BRAND_AUTHOR,
      BRAND_ORGANIZATION,
      BRAND_WEBSITE,
    ],
  };
}
