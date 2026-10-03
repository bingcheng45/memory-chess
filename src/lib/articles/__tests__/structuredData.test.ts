import {
  buildArticleListStructuredData,
  buildArticleStructuredData,
} from "@/lib/articles/structuredData";
import { BRAND_ORGANIZATION, BRAND_WEBSITE, ORGANIZATION_ID } from "@/lib/seo/brand";
import { LEARN_AUTHOR } from "@/lib/seo/learn/schema";
import { makeArticle, makeArticles, summaryOf } from "./fixtures";

const SITE = "https://thememorychess.com";

type Node = Record<string, unknown>;

function nodeOfType(graph: readonly Node[], type: string): Node {
  const node = graph.find((candidate) => candidate["@type"] === type);
  if (!node) throw new Error(`no ${type} node`);
  return node;
}

describe("buildArticleStructuredData", () => {
  const article = makeArticle(0, { updatedAt: "2026-03-05T00:00:00.000Z" });
  const url = `${SITE}/articles/${article.slug}`;
  const data = buildArticleStructuredData(article);
  const graph = data["@graph"];

  it("is one schema.org graph", () => {
    expect(data["@context"]).toBe("https://schema.org");
  });

  it("describes the article with its dates, its portrait and the site as publisher", () => {
    expect(nodeOfType(graph, "Article")).toMatchObject({
      "@id": `${url}#article`,
      headline: article.title,
      description: article.description,
      datePublished: article.publishedAt,
      dateModified: article.updatedAt,
      inLanguage: "en-US",
      isAccessibleForFree: true,
      image: {
        "@type": "ImageObject",
        url: `${SITE}${article.photo.src}`,
        width: article.photo.width,
        height: article.photo.height,
        creditText: article.photo.author,
        license: article.photo.licenseUrl,
        acquireLicensePage: article.photo.sourceUrl,
      },
      publisher: { "@id": ORGANIZATION_ID },
      mainEntityOfPage: { "@id": `${url}#webpage` },
    });
  });

  it("keeps the subject and the author apart as two people", () => {
    const node = nodeOfType(graph, "Article");

    expect(node.about).toEqual({
      "@type": "Person",
      name: article.person.name,
      description: article.person.role,
    });
    expect(node.author).toEqual({
      "@type": "Person",
      "@id": LEARN_AUTHOR.id,
      name: LEARN_AUTHOR.name,
      url: LEARN_AUTHOR.url,
    });
  });

  it("leaves the licence out of the image for a public-domain portrait", () => {
    const publicDomain = makeArticle(1, {
      photo: { ...makeArticle(1).photo, license: "Public domain", licenseUrl: null },
    });
    const image = nodeOfType(buildArticleStructuredData(publicDomain)["@graph"], "Article").image as Node;

    expect(image).not.toHaveProperty("license");
    expect(image.acquireLicensePage).toBe(publicDomain.photo.sourceUrl);
  });

  it("places the page inside the Articles collection", () => {
    expect(nodeOfType(graph, "WebPage")).toMatchObject({
      "@id": `${url}#webpage`,
      url,
      name: article.title,
      isPartOf: { "@type": "CollectionPage", "@id": `${SITE}/articles#webpage` },
      mainEntity: { "@id": `${url}#article` },
      breadcrumb: { "@id": `${url}#breadcrumb` },
    });
  });

  it("names only the two crumbs the page shows, the list and the article", () => {
    expect(nodeOfType(graph, "BreadcrumbList")).toEqual({
      "@type": "BreadcrumbList",
      "@id": `${url}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Articles", item: `${SITE}/articles` },
        { "@type": "ListItem", position: 2, name: article.title, item: url },
      ],
    });
  });

  it("carries the brand nodes unchanged", () => {
    expect(graph).toContainEqual(BRAND_ORGANIZATION);
    expect(graph).toContainEqual(BRAND_WEBSITE);
  });
});

describe("buildArticleListStructuredData", () => {
  const summaries = makeArticles(3).map(summaryOf);
  const graph = buildArticleListStructuredData(summaries)["@graph"];

  it("is a collection page listing every article in order", () => {
    expect(nodeOfType(graph, "CollectionPage")).toMatchObject({
      "@id": `${SITE}/articles#webpage`,
      url: `${SITE}/articles`,
      inLanguage: "en-US",
      isPartOf: { "@id": BRAND_WEBSITE["@id"] },
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: 3,
        itemListElement: summaries.map((summary, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: `${SITE}/articles/${summary.slug}`,
          name: summary.title,
        })),
      },
    });
  });

  it("carries the brand nodes unchanged", () => {
    expect(graph).toContainEqual(BRAND_ORGANIZATION);
    expect(graph).toContainEqual(BRAND_WEBSITE);
  });
});
