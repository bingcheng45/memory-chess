import { BRAND_ORGANIZATION, BRAND_WEBSITE, ORGANIZATION_ID, WEBSITE_ID } from "@/lib/seo/brand";
import type { LearnPage } from ".";
import { LEARN_AUTHOR, LEARN_LEVELS } from "./schema";

const SITE_URL = "https://thememorychess.com";
const HUB_URL = `${SITE_URL}/learn`;

const guideUrl = (slug: string) => `${HUB_URL}/${slug}`;

export function guideStructuredData(page: LearnPage) {
  const { meta } = page;
  const url = guideUrl(meta.slug);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${url}#article`,
        headline: meta.h1,
        name: meta.title,
        description: meta.description,
        image: { "@type": "ImageObject", url: `${url}/opengraph-image`, width: 1200, height: 630 },
        datePublished: meta.publishedAt,
        dateModified: meta.updatedAt,
        inLanguage: "en-US",
        isAccessibleForFree: true,
        articleSection: page.group.label,
        educationalLevel: LEARN_LEVELS[meta.level],
        timeRequired: `PT${page.readingMinutes}M`,
        about: { "@type": "Thing", name: meta.keywords.primary },
        author: { "@type": "Person", "@id": LEARN_AUTHOR.id, name: LEARN_AUTHOR.name, url: LEARN_AUTHOR.url },
        publisher: { "@id": ORGANIZATION_ID },
        mainEntityOfPage: { "@id": `${url}#webpage` },
        keywords: [meta.keywords.primary, ...meta.keywords.secondary].join(", "),
      },
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: meta.title,
        description: meta.description,
        isPartOf: { "@type": "CollectionPage", "@id": `${HUB_URL}#webpage` },
        mainEntity: { "@id": `${url}#article` },
        breadcrumb: { "@id": `${url}#breadcrumb` },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Learn", item: HUB_URL },
          { "@type": "ListItem", position: 3, name: meta.title, item: url },
        ],
      },
      ...(page.comparison?.products
        ? [
            {
              "@type": "ItemList",
              "@id": `${url}#compared`,
              name: meta.title,
              numberOfItems: page.comparison.products.length,
              itemListElement: page.comparison.products.map((product, index) => ({
                "@type": "ListItem",
                position: index + 1,
                name: product.name,
                ...(product.url ? { url: product.url } : {}),
              })),
            },
          ]
        : []),
      ...(page.faq.length > 0
        ? [
            {
              "@type": "FAQPage",
              "@id": `${url}#faq-schema`,
              mainEntity: page.faq.map((item) => ({
                "@type": "Question",
                name: item.question,
                acceptedAnswer: { "@type": "Answer", text: item.answer },
              })),
            },
          ]
        : []),
      BRAND_ORGANIZATION,
      BRAND_WEBSITE,
    ],
  };
}

/** `pages` in display order: an ItemList position must match what a reader sees, and grouping stays in the HTML headings. */
export function hubStructuredData(pages: readonly LearnPage[], name: string, description: string) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${HUB_URL}#webpage`,
        url: HUB_URL,
        name,
        description,
        inLanguage: "en-US",
        isPartOf: { "@id": WEBSITE_ID },
        mainEntity: { "@id": `${HUB_URL}#guides` },
        breadcrumb: { "@id": `${HUB_URL}#breadcrumb` },
      },
      {
        "@type": "ItemList",
        "@id": `${HUB_URL}#guides`,
        name: "Memory Chess learning guides",
        numberOfItems: pages.length,
        itemListElement: pages.map((page, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: page.meta.title,
          url: guideUrl(page.meta.slug),
        })),
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${HUB_URL}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Learn", item: HUB_URL },
        ],
      },
      BRAND_ORGANIZATION,
      BRAND_WEBSITE,
    ],
  };
}
