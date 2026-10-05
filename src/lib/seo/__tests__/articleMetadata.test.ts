import { makeArticle, markEveryString, summaryOf } from "@/lib/articles/__tests__/fixtures";
import { textOf, withText } from "@/lib/articles/articleText";
import { buildArticleListMetadata, buildArticleMetadata } from "@/lib/seo/articleMetadata";
import messages from "../../../../messages/en.json";

const NOINDEX_FOLLOW = { index: false, follow: true, googleBot: { index: false, follow: true } };
const PORTRAIT_URL = "https://thememorychess.com/images/articles/magnus-carlsen.jpg";
const DESCRIPTION =
  "Alder looked at a position for a few seconds and rebuilt it. This fixture says how Alder ran the test and what it showed about recall.";

const english = makeArticle(0, { updatedAt: "2026-03-05T00:00:00.000Z" });
const german = withText(english, markEveryString(textOf(english), "DE "));

describe("buildArticleMetadata", () => {
  it("gives the English page exactly the metadata it has always had, with no robots of its own", () => {
    expect(buildArticleMetadata(english, "en")).toStrictEqual({
      title: "How Alder rebuilt a board from memory",
      description: DESCRIPTION,
      alternates: { canonical: "/articles/alder-fixture" },
      openGraph: {
        type: "article",
        url: "https://thememorychess.com/articles/alder-fixture",
        title: "How Alder rebuilt a board from memory",
        description: DESCRIPTION,
        publishedTime: "2026-01-01T00:00:00.000Z",
        modifiedTime: "2026-03-05T00:00:00.000Z",
        authors: ["Bing Cheng"],
        images: [{ url: PORTRAIT_URL, width: 840, height: 1050, alt: "Alder Fixture at a chess board" }],
      },
      twitter: {
        card: "summary",
        title: "How Alder rebuilt a board from memory",
        description: DESCRIPTION,
        images: [PORTRAIT_URL],
      },
      authors: [{ name: "Bing Cheng", url: "https://thememorychess.com/about" }],
    });
  });

  it("gives a translated page its own words, a canonical to itself, noindex and no language alternates", () => {
    expect(buildArticleMetadata(german, "de")).toStrictEqual({
      title: "DE How Alder rebuilt a board from memory",
      description: `DE ${DESCRIPTION}`,
      alternates: { canonical: "/de/articles/alder-fixture" },
      robots: NOINDEX_FOLLOW,
      openGraph: {
        type: "article",
        url: "https://thememorychess.com/de/articles/alder-fixture",
        title: "DE How Alder rebuilt a board from memory",
        description: `DE ${DESCRIPTION}`,
        publishedTime: "2026-01-01T00:00:00.000Z",
        modifiedTime: "2026-03-05T00:00:00.000Z",
        authors: ["Bing Cheng"],
        images: [{ url: PORTRAIT_URL, width: 840, height: 1050, alt: "DE Alder Fixture at a chess board" }],
      },
      twitter: {
        card: "summary",
        title: "DE How Alder rebuilt a board from memory",
        description: `DE ${DESCRIPTION}`,
        images: [PORTRAIT_URL],
      },
      authors: [{ name: "Bing Cheng", url: "https://thememorychess.com/about" }],
    });
  });
});

describe("buildArticleListMetadata", () => {
  const copy = {
    title: "Articles on chess players and their memory",
    description:
      "Profiles of chess players and memory researchers. Each one gives the documented feat, the research that explains it, and a drill to try.",
  };

  it("gives the English list exactly the metadata it has always had, with no robots of its own", () => {
    expect(buildArticleListMetadata(summaryOf(english), "en", copy)).toStrictEqual({
      title: "Articles on chess players and their memory",
      description: copy.description,
      alternates: { canonical: "/articles" },
      openGraph: {
        type: "website",
        url: "https://thememorychess.com/articles",
        title: "Articles on chess players and their memory",
        description: copy.description,
        images: [{ url: PORTRAIT_URL, width: 840, height: 1050, alt: "Alder Fixture at a chess board" }],
      },
      twitter: {
        card: "summary",
        title: "Articles on chess players and their memory",
        description: copy.description,
        images: [PORTRAIT_URL],
      },
    });
  });

  it("gives a translated list the copy it is handed, a canonical to itself, noindex and no language alternates", () => {
    const germanCopy = { title: "Artikel über Schachspieler", description: "Porträts von Schachspielern." };

    expect(buildArticleListMetadata(summaryOf(german), "de", germanCopy)).toStrictEqual({
      title: "Artikel über Schachspieler",
      description: "Porträts von Schachspielern.",
      alternates: { canonical: "/de/articles" },
      robots: NOINDEX_FOLLOW,
      openGraph: {
        type: "website",
        url: "https://thememorychess.com/de/articles",
        title: "Artikel über Schachspieler",
        description: "Porträts von Schachspielern.",
        images: [{ url: PORTRAIT_URL, width: 840, height: 1050, alt: "DE Alder Fixture at a chess board" }],
      },
      twitter: {
        card: "summary",
        title: "Artikel über Schachspieler",
        description: "Porträts von Schachspielern.",
        images: [PORTRAIT_URL],
      },
    });
  });

  it("prefixes a region-qualified locale as the router does", () => {
    const metadata = buildArticleListMetadata(summaryOf(german), "pt-BR", copy);

    expect(metadata.alternates).toStrictEqual({ canonical: "/pt-BR/articles" });
    expect(metadata.openGraph).toHaveProperty("url", "https://thememorychess.com/pt-BR/articles");
  });
});

describe("the English list page's meta copy", () => {
  it("fits a search result", () => {
    const { title, description } = messages.articles.meta;

    expect(title.length).toBeGreaterThan(0);
    expect(title.length).toBeLessThanOrEqual(60);
    expect(description.length).toBeGreaterThanOrEqual(120);
    expect(description.length).toBeLessThanOrEqual(155);
  });
});
