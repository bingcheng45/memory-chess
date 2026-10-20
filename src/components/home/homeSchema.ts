import { BRAND_ORGANIZATION, BRAND_WEBSITE, ORGANIZATION_ID, SCHEMA_IMAGES, socialImage, WEBSITE_ID } from "@/lib/seo/brand";
import { languageTag, localizedUrl } from "@/lib/seo/alternates";
import { TUTORIAL_VIDEO } from "@/components/ui/tutorialVideo";
import { GAME_VIDEO, type GameVideo } from "./gameVideo";

/**
 * No aggregateRating, because the site has no rating data and an invented one breaks Google's policy.
 */
export function homeSchema(locale: string, description: string, gameVideo: GameVideo | null = GAME_VIDEO) {
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
        image: SCHEMA_IMAGES,
        screenshot: socialImage.url,
      },
      {
        "@type": "VideoObject",
        "@id": `${localizedUrl("/", "en")}/#tutorial-video`,
        ...TUTORIAL_VIDEO,
        inLanguage: "en",
      },
      ...(gameVideo
        ? [
            {
              "@type": "VideoObject",
              "@id": `${localizedUrl("/", "en")}/#game-video`,
              name: gameVideo.name,
              description: gameVideo.description,
              thumbnailUrl: gameVideo.thumbnailUrl,
              uploadDate: gameVideo.uploadDate,
              duration: gameVideo.duration,
              embedUrl: gameVideo.embedUrl,
              contentUrl: gameVideo.contentUrl,
              inLanguage: "en",
            },
          ]
        : []),
    ],
  };
}
