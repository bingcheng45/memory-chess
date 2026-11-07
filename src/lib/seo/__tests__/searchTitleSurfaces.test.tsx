import { EN_LEARN_PAGES } from "@/lib/seo/learn";
import { guideStructuredData } from "@/lib/seo/learn/structuredData";

const SEARCH_TITLE = "Chess Visualization Exercises: Test and Train";
const TRANSLATED_TITLE = "Visualisierung im Schach trainieren: das Brett sehen";
const page = EN_LEARN_PAGES.find((entry) => entry.meta.slug === "chess-visualization-exercises")!;

type Node = { "@type": string; name?: string; itemListElement?: { name: string }[] };
const graphOf = (locale: string, title?: string): Node[] =>
  guideStructuredData(title ? ({ ...page, meta: { ...page.meta, title } } as typeof page) : page, locale)["@graph"] as Node[];

describe("the English visualization guide's structured data", () => {
  it("names the Article, the WebPage and the last breadcrumb with the search title", () => {
    const graph = graphOf("en");

    expect(graph.find((node) => node["@type"] === "Article")?.name).toBe(SEARCH_TITLE);
    expect(graph.find((node) => node["@type"] === "WebPage")?.name).toBe(SEARCH_TITLE);
    expect(graph.find((node) => node["@type"] === "BreadcrumbList")?.itemListElement?.[2].name).toBe(SEARCH_TITLE);
  });

  it("keeps a translated page on the title of its translation", () => {
    const graph = graphOf("de", TRANSLATED_TITLE);

    expect(graph.find((node) => node["@type"] === "Article")?.name).toBe(TRANSLATED_TITLE);
    expect(graph.find((node) => node["@type"] === "WebPage")?.name).toBe(TRANSLATED_TITLE);
    expect(graph.find((node) => node["@type"] === "BreadcrumbList")?.itemListElement?.[2].name).toBe(TRANSLATED_TITLE);
  });
});
