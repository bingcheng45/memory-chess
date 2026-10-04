import { textOf, withText } from "@/lib/articles/articleText";
import {
  buildArticleListStructuredData,
  buildArticleStructuredData,
} from "@/lib/articles/structuredData";
import { BRAND_ORGANIZATION, BRAND_WEBSITE } from "@/lib/seo/brand";
import { makeArticle, makeArticles, markEveryString, summaryOf } from "./fixtures";

const SITE = "https://thememorychess.com";
const DESCRIPTION =
  "Alder looked at a position for a few seconds and rebuilt it. This fixture says how Alder ran the test and what it showed about recall.";
const IMAGE = {
  "@type": "ImageObject",
  url: `${SITE}/images/articles/magnus-carlsen.jpg`,
  width: 840,
  height: 1050,
  creditText: "Fixture Photographer",
  acquireLicensePage: "https://commons.wikimedia.org/wiki/File:Fixture.jpg",
  license: "https://creativecommons.org/licenses/by/4.0",
};
const AUTHOR = {
  "@type": "Person",
  "@id": `${SITE}/about#bing-cheng`,
  name: "Bing Cheng",
  url: `${SITE}/about`,
};

type Node = Record<string, unknown>;

function nodeOfType(graph: readonly Node[], type: string): Node {
  const node = graph.find((candidate) => candidate["@type"] === type);
  if (!node) throw new Error(`no ${type} node`);
  return node;
}

const english = makeArticle(0, { updatedAt: "2026-03-05T00:00:00.000Z" });
const german = withText(english, markEveryString(textOf(english), "DE "));

describe("buildArticleStructuredData", () => {
  it("describes the English page exactly as it always has", () => {
    const url = `${SITE}/articles/alder-fixture`;

    expect(buildArticleStructuredData(english, "en", "Articles")).toStrictEqual({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Article",
          "@id": `${url}#article`,
          headline: "How Alder rebuilt a board from memory",
          name: "How Alder rebuilt a board from memory",
          description: DESCRIPTION,
          image: IMAGE,
          datePublished: "2026-01-01T00:00:00.000Z",
          dateModified: "2026-03-05T00:00:00.000Z",
          inLanguage: "en-US",
          isAccessibleForFree: true,
          about: { "@type": "Person", name: "Alder Fixture", description: "Fixture champion 1" },
          author: AUTHOR,
          publisher: { "@id": `${SITE}/#organization` },
          mainEntityOfPage: { "@id": `${url}#webpage` },
        },
        {
          "@type": "WebPage",
          "@id": `${url}#webpage`,
          url,
          name: "How Alder rebuilt a board from memory",
          description: DESCRIPTION,
          inLanguage: "en-US",
          isPartOf: { "@type": "CollectionPage", "@id": `${SITE}/articles#webpage` },
          mainEntity: { "@id": `${url}#article` },
          breadcrumb: { "@id": `${url}#breadcrumb` },
        },
        {
          "@type": "BreadcrumbList",
          "@id": `${url}#breadcrumb`,
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Articles", item: `${SITE}/articles` },
            { "@type": "ListItem", position: 2, name: "How Alder rebuilt a board from memory", item: url },
          ],
        },
        BRAND_ORGANIZATION,
        BRAND_WEBSITE,
      ],
    });
  });

  it("describes a translated page in its language, at its own address, inside its own list", () => {
    const url = `${SITE}/de/articles/alder-fixture`;

    expect(buildArticleStructuredData(german, "de", "Artikel")).toStrictEqual({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Article",
          "@id": `${url}#article`,
          headline: "DE How Alder rebuilt a board from memory",
          name: "DE How Alder rebuilt a board from memory",
          description: `DE ${DESCRIPTION}`,
          image: { ...IMAGE, creditText: "DE Fixture Photographer" },
          datePublished: "2026-01-01T00:00:00.000Z",
          dateModified: "2026-03-05T00:00:00.000Z",
          inLanguage: "de",
          isAccessibleForFree: true,
          about: { "@type": "Person", name: "DE Alder Fixture", description: "DE Fixture champion 1" },
          author: AUTHOR,
          publisher: { "@id": `${SITE}/#organization` },
          mainEntityOfPage: { "@id": `${url}#webpage` },
        },
        {
          "@type": "WebPage",
          "@id": `${url}#webpage`,
          url,
          name: "DE How Alder rebuilt a board from memory",
          description: `DE ${DESCRIPTION}`,
          inLanguage: "de",
          isPartOf: { "@type": "CollectionPage", "@id": `${SITE}/de/articles#webpage` },
          mainEntity: { "@id": `${url}#article` },
          breadcrumb: { "@id": `${url}#breadcrumb` },
        },
        {
          "@type": "BreadcrumbList",
          "@id": `${url}#breadcrumb`,
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Artikel", item: `${SITE}/de/articles` },
            { "@type": "ListItem", position: 2, name: "DE How Alder rebuilt a board from memory", item: url },
          ],
        },
        BRAND_ORGANIZATION,
        BRAND_WEBSITE,
      ],
    });
  });

  it("leaves the licence out of the image for a public-domain portrait", () => {
    const publicDomain = makeArticle(1, {
      photo: { ...makeArticle(1).photo, license: "Public domain", licenseUrl: null },
    });
    const image = nodeOfType(buildArticleStructuredData(publicDomain, "en", "Articles")["@graph"], "Article")
      .image as Node;

    expect(image).not.toHaveProperty("license");
    expect(image.acquireLicensePage).toBe("https://commons.wikimedia.org/wiki/File:Fixture.jpg");
  });
});

describe("buildArticleListStructuredData", () => {
  const summaries = makeArticles(3).map(summaryOf);

  it("describes the English list exactly as it always has", () => {
    const copy = {
      title: "Articles on chess players and their memory",
      description:
        "Profiles of chess players and memory researchers. Each one gives the documented feat, the research that explains it, and a drill to try.",
    };

    expect(buildArticleListStructuredData(summaries, "en", copy)).toStrictEqual({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CollectionPage",
          "@id": `${SITE}/articles#webpage`,
          url: `${SITE}/articles`,
          name: "Articles on chess players and their memory",
          description: copy.description,
          inLanguage: "en-US",
          isPartOf: { "@id": `${SITE}/#website` },
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: 3,
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                url: `${SITE}/articles/alder-fixture`,
                name: "How Alder rebuilt a board from memory",
              },
              {
                "@type": "ListItem",
                position: 2,
                url: `${SITE}/articles/birch-fixture`,
                name: "How Birch rebuilt a board from memory",
              },
              {
                "@type": "ListItem",
                position: 3,
                url: `${SITE}/articles/cedar-fixture`,
                name: "How Cedar rebuilt a board from memory",
              },
            ],
          },
        },
        BRAND_ORGANIZATION,
        BRAND_WEBSITE,
      ],
    });
  });

  it("describes a translated list in its language, with its own address and the addresses of its articles", () => {
    const copy = { title: "Artikel über Schachspieler", description: "Porträts von Schachspielern." };
    const graph = buildArticleListStructuredData(summaries.slice(0, 1), "pt-BR", copy)["@graph"];

    expect(graph).toStrictEqual([
      {
        "@type": "CollectionPage",
        "@id": `${SITE}/pt-BR/articles#webpage`,
        url: `${SITE}/pt-BR/articles`,
        name: "Artikel über Schachspieler",
        description: "Porträts von Schachspielern.",
        inLanguage: "pt-BR",
        isPartOf: { "@id": `${SITE}/#website` },
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: 1,
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              url: `${SITE}/pt-BR/articles/alder-fixture`,
              name: "How Alder rebuilt a board from memory",
            },
          ],
        },
      },
      BRAND_ORGANIZATION,
      BRAND_WEBSITE,
    ]);
  });
});
