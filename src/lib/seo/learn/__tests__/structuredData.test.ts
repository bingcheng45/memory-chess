import { toPage } from "..";
import type { LearnDocument } from "../schema";
import { guideStructuredData } from "../structuredData";

const base = {
  intro: { quickAnswer: "Answer.", takeaways: [], audience: [] },
  sections: [{ id: "only", heading: "Only", blocks: [{ kind: "prose", paragraphs: ["Some words."] }] }],
  end: [{ kind: "cta", target: { kind: "game", label: "Play", pieceCount: 6, memorizeTime: 10 }, why: "Why play." }],
} as const satisfies Omit<LearnDocument, "meta" | "comparison">;

const meta = {
  title: "Trainers compared",
  h1: "Trainers compared",
  description: "A fixture.",
  level: "beginner",
  publishedAt: "2026-10-20T00:00:00.000Z",
  updatedAt: "2026-10-21T00:00:00.000Z",
  questions: ["One?", "Two?"],
  keywords: { primary: "fixture", secondary: [] },
} as const;

const comparisonDoc: LearnDocument = {
  ...base,
  meta: { ...meta, slug: "trainers-compared", group: "compare" },
  comparison: {
    checkedAt: "2026-10-20T00:00:00.000Z",
    disclosure: "Memory Chess publishes this page.",
    products: [
      { name: "Memory Chess", url: "https://thememorychess.com" },
      { name: "Lichess coordinate trainer", url: "https://lichess.org/training/coordinate" },
      { name: "An app whose listing is gone" },
    ],
  },
};

const guideDoc: LearnDocument = { ...base, meta: { ...meta, slug: "a-guide", group: "memory" } };

const nodeOfType = (doc: LearnDocument, type: string) =>
  guideStructuredData(toPage(doc))["@graph"].find((node) => (node as { "@type": string })["@type"] === type);

describe("comparison page structured data", () => {
  it("lists the compared products as an ItemList in table order, with a url only where the page opened", () => {
    expect(nodeOfType(comparisonDoc, "ItemList")).toEqual({
      "@type": "ItemList",
      "@id": "https://thememorychess.com/learn/trainers-compared#compared",
      name: "Trainers compared",
      numberOfItems: 3,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Memory Chess", url: "https://thememorychess.com" },
        { "@type": "ListItem", position: 2, name: "Lichess coordinate trainer", url: "https://lichess.org/training/coordinate" },
        { "@type": "ListItem", position: 3, name: "An app whose listing is gone" },
      ],
    });
  });

  it("dates the article by its last edit and keeps the breadcrumb to Learn", () => {
    expect(nodeOfType(comparisonDoc, "Article")).toMatchObject({
      datePublished: "2026-10-20T00:00:00.000Z",
      dateModified: "2026-10-21T00:00:00.000Z",
      articleSection: "Compare training tools",
    });
    expect(nodeOfType(comparisonDoc, "BreadcrumbList")).toMatchObject({
      itemListElement: [
        { position: 1, name: "Home", item: "https://thememorychess.com" },
        { position: 2, name: "Learn", item: "https://thememorychess.com/learn" },
        { position: 3, name: "Trainers compared", item: "https://thememorychess.com/learn/trainers-compared" },
      ],
    });
  });

  it("gives an ordinary guide no ItemList", () => {
    expect(nodeOfType(guideDoc, "ItemList")).toBeUndefined();
    expect(nodeOfType(guideDoc, "Article")).toMatchObject({ articleSection: "Memory and patterns" });
  });
});
