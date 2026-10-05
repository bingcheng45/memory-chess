import type { ReactNode } from "react";
import { setRequestLocale } from "next-intl/server";
import { render, screen, within } from "@/test-utils/intl";
import * as pageModule from "@/app/[locale]/articles/page";
import ArticlesPage, { generateMetadata, revalidate } from "@/app/[locale]/articles/page";
import ArticleList from "@/components/articles/ArticleList";
import { GERMAN_MESSAGES } from "@/components/articles/__tests__/chromeCatalogues";
import { sortedFirstPaintInlineScript } from "@/components/articles/sortedFirstPaint";
import { ARTICLE_SLUGS, getArticleSummaries } from "@/lib/articles";
import { NO_ARTICLE_STATS, type ArticleStats } from "@/lib/articles/stats";
import { loadArticleText } from "@/lib/articles/translations";
import { getArticleStats } from "@/lib/services/articleStatsService";

jest.mock("next-intl/server", () => ({
  setRequestLocale: jest.fn(),
  getTranslations: jest.fn(async ({ locale, namespace }: { locale: string; namespace: string }) => {
    const { createTranslator } = jest.requireActual("next-intl");
    const messages =
      locale === "de"
        ? jest.requireActual("@/components/articles/__tests__/chromeCatalogues").GERMAN_MESSAGES
        : jest.requireActual("../../../../../messages/en.json");
    return createTranslator({ locale, messages, namespace });
  }),
}));

jest.mock("next/navigation", () => ({
  ...jest.requireActual("next/navigation"),
  notFound: jest.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

jest.mock("@/lib/articles/translatedLocales");

jest.mock("@/lib/articles/translations", () => ({
  loadArticleText: jest.fn(async (slug: string, locale: string, english: unknown) =>
    jest.requireActual("@/lib/articles/__tests__/fixtures").markEveryString(english, `${locale.toUpperCase()} `),
  ),
}));

jest.mock("@/lib/services/articleStatsService", () => ({
  getArticleStats: jest.fn(),
}));

jest.mock("@/components/articles/ArticleList", () => ({
  __esModule: true,
  default: jest.fn(({ heading }: { heading: ReactNode }) => (
    <div data-testid="article-list">{heading}</div>
  )),
}));

jest.mock("@/components/ui/PageHeader", () => {
  function MockPageHeader() {
    return <div>PageHeader</div>;
  }

  return MockPageHeader;
});

const STATS: ArticleStats = {
  "magnus-carlsen": { views: 120, likes: 7 },
  "judit-polgar": { views: 4, likes: 0 },
};
const ENGLISH_META_TITLE = "Articles on chess players and their memory";
const NOINDEX_FOLLOW = { index: false, follow: true, googleBot: { index: false, follow: true } };

const paramsFor = (locale: string) => ({ params: Promise.resolve({ locale }) });

async function renderPage(locale = "en") {
  const page = await ArticlesPage(paramsFor(locale));
  return locale === "de" ? render(page, { locale, messages: GERMAN_MESSAGES }) : render(page);
}

function aboutSection(heading: string): HTMLElement {
  const section = screen.getByRole("heading", { level: 2, name: heading }).closest("section");
  if (section === null) throw new Error("the heading sits in no section");
  return section;
}

function paragraphsOf(section: HTMLElement): (string | null)[] {
  return Array.from(section.querySelectorAll("p"), (paragraph) => paragraph.textContent);
}

function listProps() {
  return jest.mocked(ArticleList).mock.calls[0][0];
}

function collectionPage(container: HTMLElement): Record<string, unknown> {
  const script = container.querySelector('script[type="application/ld+json"]');
  if (script === null) throw new Error("the page has no JSON-LD");
  return JSON.parse(script.textContent ?? "")["@graph"][0];
}

describe("ArticlesPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getArticleStats).mockResolvedValue(STATS);
  });

  it("revalidates every five minutes and exports no dynamic mode", () => {
    expect(revalidate).toBe(300);
    expect(Object.keys(pageModule)).not.toContain("dynamic");
  });

  it("asks for the counts of exactly the registry slugs, after pinning the locale", async () => {
    await renderPage();

    expect(getArticleStats).toHaveBeenCalledTimes(1);
    expect(getArticleStats).toHaveBeenCalledWith(ARTICLE_SLUGS);
    expect(setRequestLocale).toHaveBeenCalledWith("en");
    expect(jest.mocked(setRequestLocale).mock.invocationCallOrder[0]).toBeLessThan(
      jest.mocked(getArticleStats).mock.invocationCallOrder[0],
    );
  });

  it("hands the list its articles, the counts and the heading, and nothing else", async () => {
    await renderPage();

    expect(listProps()).toEqual(
      expect.objectContaining({ articles: await getArticleSummaries("en"), stats: STATS }),
    );
    expect(listProps().articles[0]).toMatchObject({
      slug: "magnus-carlsen",
      title: "How Magnus Carlsen names a famous game from one position",
      publishedLabel: "Oct 5, 2026",
    });
    expect(Object.keys(listProps()).sort()).toEqual(["articles", "heading", "stats"]);
  });

  it("passes its header as the heading and leaves the header's margins to the list", async () => {
    await renderPage();

    const header = screen.getByTestId("article-list").querySelector("header");
    if (header === null) throw new Error("the heading is not a <header>");

    expect(header).not.toHaveClass("mb-[26px]");
    expect(header).not.toHaveClass("mt-[22px]");
    expect(within(header).getByRole("heading", { level: 1, name: "Articles" })).toBeInTheDocument();
    expect(
      within(header).getByText("Chess players and memory researchers, one profile at a time."),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("runs the sorted first paint script before the list is parsed", async () => {
    const { container } = await renderPage();
    const script = container.querySelector("script:not([type])");
    if (script === null) throw new Error("the page has no inline script");

    expect(script.textContent).toBe(sortedFirstPaintInlineScript());
    expect(
      script.compareDocumentPosition(screen.getByTestId("article-list")) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it("still renders when there are no counts", async () => {
    jest.mocked(getArticleStats).mockResolvedValue(NO_ARTICLE_STATS);

    await renderPage();

    expect(listProps()).toEqual(expect.objectContaining({ stats: NO_ARTICLE_STATS }));
    expect(screen.getByRole("heading", { level: 2, name: "How these articles are made" })).toBeInTheDocument();
  });

  it("says how the articles are made in three paragraphs, then asks for corrections", async () => {
    await renderPage();
    const about = aboutSection("How these articles are made");
    const paragraphs = paragraphsOf(about);

    expect(paragraphs).toHaveLength(4);
    expect(paragraphs[0]).toMatch(/^Each article follows one chess player or researcher/);
    expect(paragraphs[1]).toMatch(/^Every article has the same parts\./);
    expect(paragraphs[2]).toMatch(
      /^The articles are researched and drafted with AI assistance .* is told as a story\. Articles in other languages are translated from the English text with AI assistance, and each translation is checked before it goes up\.$/,
    );
    expect(paragraphs[3]).toBe("If something here is wrong, send a correction.");
    expect(within(about).getByRole("link", { name: "send a correction" })).toHaveAttribute("href", "/contact-us");
  });

  it("carries no translation note, since the English list is the original", async () => {
    const { container } = await renderPage();

    expect(container.querySelector("[data-translation-note]")).toBeNull();
    expect(within(aboutSection("How these articles are made")).getAllByRole("link")).toHaveLength(1);
  });

  it("describes the English list at its bare address in its structured data", async () => {
    const { container } = await renderPage();

    expect(collectionPage(container)).toMatchObject({
      "@id": "https://thememorychess.com/articles#webpage",
      url: "https://thememorychess.com/articles",
      name: ENGLISH_META_TITLE,
      inLanguage: "en-US",
    });
  });
});

describe("ArticlesPage in a locale the articles are translated into", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getArticleStats).mockResolvedValue(STATS);
  });

  it("hands the list the translated articles with dates in that language, under a translated heading", async () => {
    await renderPage("de");

    expect(setRequestLocale).toHaveBeenCalledWith("de");
    expect(listProps().articles.map((article) => article.slug)).toEqual(ARTICLE_SLUGS);
    expect(listProps().articles[0]).toMatchObject({
      slug: "magnus-carlsen",
      title: "DE How Magnus Carlsen names a famous game from one position",
      person: { name: "DE Magnus Carlsen" },
      publishedLabel: "5. Okt. 2026",
    });
    expect(screen.getByRole("heading", { level: 1, name: "Artikel" })).toBeInTheDocument();
    expect(
      screen.getByText("Schachspieler und Gedächtnisforscher, ein Porträt nach dem anderen."),
    ).toBeInTheDocument();
  });

  it("says how the articles are made in that language, and ends on the translation note", async () => {
    await renderPage("de");
    const about = aboutSection("So entstehen diese Artikel");

    expect(paragraphsOf(about)).toEqual([
      "Jeder Artikel folgt einer Person und einer Frage zu ihrem Gedächtnis.",
      "Jeder Artikel hat dieselben Teile.",
      "Die Artikel werden mit KI-Unterstützung recherchiert und geprüft.",
      "Wenn hier etwas nicht stimmt, schick uns eine Korrektur.",
      "Mit KI-Unterstützung aus dem Englischen übersetzt. Maßgeblich ist der englische Artikel. Auf Englisch lesen",
    ]);
    expect(within(about).getByRole("link", { name: "schick uns eine Korrektur" })).toHaveAttribute(
      "href",
      "/de/contact-us",
    );
    expect(screen.queryByText(/How these articles are made|If something here is wrong/)).not.toBeInTheDocument();
  });

  it("links the translation note to the English list at its bare address", async () => {
    await renderPage("de");
    const note = aboutSection("So entstehen diese Artikel").lastElementChild as HTMLElement;
    const link = within(note).getByRole("link", { name: "Auf Englisch lesen" });

    expect(note).toHaveAttribute("data-translation-note");
    expect(note).toHaveAttribute("data-authorship-note");
    expect(link).toHaveAttribute("href", "/articles");
    expect(link).toHaveAttribute("hreflang", "en");
  });

  it("describes the translated list at its prefixed address in its structured data", async () => {
    const { container } = await renderPage("de");

    expect(collectionPage(container)).toMatchObject({
      "@id": "https://thememorychess.com/de/articles#webpage",
      url: "https://thememorychess.com/de/articles",
      name: "Artikel über Schachspieler",
      description: "Porträts von Schachspielern.",
      inLanguage: "de",
      mainEntity: {
        itemListElement: expect.arrayContaining([
          {
            "@type": "ListItem",
            position: 1,
            url: "https://thememorychess.com/de/articles/magnus-carlsen",
            name: "DE How Magnus Carlsen names a famous game from one position",
          },
        ]),
      },
    });
  });
});

describe("ArticlesPage in a locale the articles are not translated into", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getArticleStats).mockResolvedValue(STATS);
  });

  it("is not found, and loads neither a translation nor the counts", async () => {
    await expect(ArticlesPage(paramsFor("fr"))).rejects.toThrow("NEXT_NOT_FOUND");
    expect(loadArticleText).not.toHaveBeenCalled();
    expect(getArticleStats).not.toHaveBeenCalled();

    await renderPage("de");
    expect(loadArticleText).toHaveBeenCalledTimes(ARTICLE_SLUGS.length);
    expect(getArticleStats).toHaveBeenCalledTimes(1);
  });
});

describe("the list page's metadata", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("is the English metadata, indexable, at the bare address", async () => {
    const metadata = await generateMetadata(paramsFor("en"));

    expect(metadata.title).toBe(ENGLISH_META_TITLE);
    expect(metadata.alternates).toStrictEqual({ canonical: "/articles" });
    expect(metadata).not.toHaveProperty("robots");
    expect(metadata.openGraph).toMatchObject({
      url: "https://thememorychess.com/articles",
      images: [{ alt: "Magnus Carlsen at a press conference in 2025" }],
    });
  });

  it("is translated, noindex and canonical to itself in a translated locale", async () => {
    const metadata = await generateMetadata(paramsFor("de"));

    expect(metadata.title).toBe("Artikel über Schachspieler");
    expect(metadata.description).toBe("Porträts von Schachspielern.");
    expect(metadata.alternates).toStrictEqual({ canonical: "/de/articles" });
    expect(metadata.robots).toStrictEqual(NOINDEX_FOLLOW);
    expect(metadata.openGraph).toMatchObject({
      url: "https://thememorychess.com/de/articles",
      images: [{ alt: "DE Magnus Carlsen at a press conference in 2025" }],
    });
  });

  it("is not found in a locale the articles are not translated into", async () => {
    await expect(generateMetadata(paramsFor("fr"))).rejects.toThrow("NEXT_NOT_FOUND");
    expect(loadArticleText).not.toHaveBeenCalled();
  });
});
