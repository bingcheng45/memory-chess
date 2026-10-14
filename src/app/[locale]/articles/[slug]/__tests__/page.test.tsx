import { render, screen } from "@testing-library/react";
import { setRequestLocale } from "next-intl/server";
import * as routeModule from "@/app/[locale]/articles/[slug]/page";
import ArticleRoute, {
  generateMetadata,
  generateStaticParams,
  revalidate,
} from "@/app/[locale]/articles/[slug]/page";
import ArticlePage from "@/components/articles/ArticlePage";
import { ARTICLE_SLUGS, getArticle, getNextArticle } from "@/lib/articles";
import { NO_ARTICLE_STATS } from "@/lib/articles/stats";
import { loadArticleText } from "@/lib/articles/translations";
import { getArticleStats } from "@/lib/services/articleStatsService";

jest.mock("next-intl/server", () => ({
  setRequestLocale: jest.fn(),
}));

jest.mock("next/navigation", () => ({
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

jest.mock("@/components/articles/ArticlePage", () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="article-page" />),
}));

const SLUG = "magnus-carlsen";
const ENGLISH_TITLE = "How Magnus Carlsen names a famous game from one position";
const ENGLISH_SEARCH_TITLE = "How Magnus Carlsen names a game from one position";
const COUNTS = { views: 120, likes: 7 };
const NOINDEX_FOLLOW = { index: false, follow: true, googleBot: { index: false, follow: true } };

const paramsFor = (slug: string, locale: string) => ({ params: Promise.resolve({ slug, locale }) });

function routeFor(slug: string, locale = "en") {
  return ArticleRoute(paramsFor(slug, locale));
}

function pageProps() {
  return jest.mocked(ArticlePage).mock.calls[0][0];
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(getArticleStats).mockResolvedValue({ [SLUG]: COUNTS, "judit-polgar": { views: 4, likes: 0 } });
});

describe("ArticleRoute", () => {
  it("revalidates every five minutes and exports no dynamic mode", () => {
    expect(revalidate).toBe(300);
    expect(Object.keys(routeModule)).not.toContain("dynamic");
  });

  it("asks for the counts of the one article, after pinning the locale", async () => {
    render(await routeFor(SLUG));

    expect(getArticleStats).toHaveBeenCalledTimes(1);
    expect(getArticleStats).toHaveBeenCalledWith([SLUG]);
    expect(setRequestLocale).toHaveBeenCalledWith("en");
    expect(jest.mocked(setRequestLocale).mock.invocationCallOrder[0]).toBeLessThan(
      jest.mocked(getArticleStats).mock.invocationCallOrder[0],
    );
  });

  it("hands the article page the English entry, the next article and that article's counts", async () => {
    render(await routeFor(SLUG));

    expect(pageProps()).toEqual({
      article: await getArticle(SLUG, "en"),
      nextArticle: await getNextArticle(SLUG, "en"),
      counts: COUNTS,
      charsPerSecond: 150,
    });
    expect(pageProps().article.title).toBe(ENGLISH_TITLE);
    expect(pageProps().nextArticle?.publishedLabel).toBe("Oct 5, 2026");
    expect(loadArticleText).not.toHaveBeenCalled();
  });

  it("still renders, without counts, when there are none", async () => {
    jest.mocked(getArticleStats).mockResolvedValue(NO_ARTICLE_STATS);

    render(await routeFor(SLUG));

    expect(screen.getByTestId("article-page")).toBeInTheDocument();
    expect(pageProps().article.slug).toBe(SLUG);
    expect(pageProps().counts).toBeUndefined();
  });

  it("does not read counts for a slug outside the registry", async () => {
    await expect(routeFor("not-an-article")).rejects.toThrow("NEXT_NOT_FOUND");
    expect(getArticleStats).not.toHaveBeenCalled();

    render(await routeFor(SLUG));
    expect(getArticleStats).toHaveBeenCalledTimes(1);
  });
});

describe("ArticleRoute in a locale the articles are translated into", () => {
  it("hands the article page the translated article and the translated next article", async () => {
    render(await routeFor(SLUG, "de"));

    const { article, nextArticle, counts } = pageProps();
    const nextSlug = ARTICLE_SLUGS[(ARTICLE_SLUGS.indexOf(SLUG) + 1) % ARTICLE_SLUGS.length];

    expect(setRequestLocale).toHaveBeenCalledWith("de");
    expect(article.slug).toBe(SLUG);
    expect(article.title).toBe(`DE ${ENGLISH_TITLE}`);
    expect(article.sections[0].heading).toBe("DE Ten boards he could not see");
    expect(article.photo.src).toBe("/images/articles/magnus-carlsen.jpg");
    expect(nextArticle?.slug).toBe(nextSlug);
    expect(nextArticle?.title).toMatch(/^DE /);
    expect(nextArticle?.publishedLabel).toBe("5. Okt. 2026");
    expect(counts).toEqual(COUNTS);
  });

  it("types a body half as long as the English one at half the English rate, so both take as long", async () => {
    const english = await getArticle(SLUG, "en");
    const englishLength = (english?.sections ?? [])
      .flatMap((section) => [section.heading, ...section.paragraphs])
      .reduce((total, text) => total + text.length, 0);
    const halfAsLong = [{ heading: "Kurz", paragraphs: ["x".repeat(Math.floor(englishLength / 2) - "Kurz".length)] }];
    jest
      .mocked(loadArticleText)
      .mockImplementationOnce(async (slug, locale, text) => ({ ...text, sections: halfAsLong }));

    render(await routeFor(SLUG, "de"));

    expect(jest.mocked(loadArticleText).mock.calls[0].slice(0, 2)).toEqual([SLUG, "de"]);
    expect(pageProps().article.sections).toEqual(halfAsLong);
    expect(pageProps().charsPerSecond).toBeCloseTo(75, 1);
  });

  it("is not found for a slug outside the registry", async () => {
    await expect(routeFor("not-an-article", "de")).rejects.toThrow("NEXT_NOT_FOUND");
  });
});

describe("ArticleRoute in a locale the articles are not translated into", () => {
  it("is not found, and loads neither a translation nor the counts", async () => {
    await expect(routeFor(SLUG, "fr")).rejects.toThrow("NEXT_NOT_FOUND");
    expect(loadArticleText).not.toHaveBeenCalled();
    expect(getArticleStats).not.toHaveBeenCalled();

    render(await routeFor(SLUG, "de"));
    expect(jest.mocked(loadArticleText).mock.calls[0].slice(0, 2)).toEqual([SLUG, "de"]);
    expect(getArticleStats).toHaveBeenCalledTimes(1);
  });
});

describe("the article route's static params", () => {
  it("prerenders every article in a locale that serves them and none elsewhere", () => {
    const everySlug = ARTICLE_SLUGS.map((slug) => ({ slug }));

    expect(generateStaticParams({ params: { locale: "en" } })).toEqual(everySlug);
    expect(generateStaticParams({ params: { locale: "de" } })).toEqual(everySlug);
    expect(generateStaticParams({ params: { locale: "de" } })).toContainEqual({ slug: SLUG });
    expect(generateStaticParams({ params: { locale: "fr" } })).toEqual([]);
  });
});

describe("the article route's metadata", () => {
  it("is the English metadata, indexable, at the bare address", async () => {
    const metadata = await generateMetadata(paramsFor(SLUG, "en"));

    expect(metadata.title).toBe(ENGLISH_SEARCH_TITLE);
    expect(metadata.alternates).toStrictEqual({ canonical: "/articles/magnus-carlsen" });
    expect(metadata).not.toHaveProperty("robots");
    expect(metadata.openGraph).toHaveProperty("url", "https://thememorychess.com/articles/magnus-carlsen");
  });

  it("is translated, noindex and canonical to itself in a translated locale", async () => {
    const metadata = await generateMetadata(paramsFor(SLUG, "de"));

    expect(metadata.title).toBe(`DE ${ENGLISH_TITLE}`);
    expect(metadata.alternates).toStrictEqual({ canonical: "/de/articles/magnus-carlsen" });
    expect(metadata.robots).toStrictEqual(NOINDEX_FOLLOW);
    expect(metadata.openGraph).toHaveProperty("url", "https://thememorychess.com/de/articles/magnus-carlsen");
  });

  it("is not found for an unknown slug or a locale the articles are not translated into", async () => {
    await expect(generateMetadata(paramsFor("not-an-article", "en"))).rejects.toThrow("NEXT_NOT_FOUND");
    await expect(generateMetadata(paramsFor(SLUG, "fr"))).rejects.toThrow("NEXT_NOT_FOUND");
    expect(loadArticleText).not.toHaveBeenCalled();
  });
});
