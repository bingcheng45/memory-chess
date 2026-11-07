import { generateStaticParams } from "@/app/[locale]/articles/[slug]/page";
import { getArticle, getArticleSummaries, getNextArticle, getTileArticles } from "@/lib/articles";
import { isArticleServedIn } from "@/lib/articles/articleLocales";
import { loadArticleText } from "@/lib/articles/translations";
import { markEveryString } from "./fixtures";

jest.mock("@/lib/articles/translatedLocales", () => ({
  TRANSLATED_ARTICLE_LOCALES: ["de"],
  ENGLISH_ONLY_ARTICLE_SLUGS: ["adriaan-de-groot", "miguel-najdorf", "garry-kasparov", "dominic-obrien"],
}));
jest.mock("@/lib/articles/translations", () => ({
  loadArticleText: jest.fn(async (slug: string, locale: string, english: unknown) => markEveryString(english, "DE ")),
}));
jest.mock("@/lib/articles/chrome", () => ({ loadArticleChrome: jest.fn(async () => ({})) }));

const slugsOf = (articles: readonly { slug: string }[]) => articles.map((article) => article.slug);
const askedSlugs = () => jest.mocked(loadArticleText).mock.calls.map(([slug]) => slug);

beforeEach(() => jest.mocked(loadArticleText).mockClear());

describe("an article published in English before its translations", () => {
  it("is served in English and in no translated locale", () => {
    expect(isArticleServedIn("adriaan-de-groot", "en")).toBe(true);
    expect(isArticleServedIn("adriaan-de-groot", "de")).toBe(false);
    expect(isArticleServedIn("magnus-carlsen", "de")).toBe(true);
    expect(isArticleServedIn("magnus-carlsen", "fr")).toBe(false);
  });

  it("is listed in English and left out of the German list and tiles", async () => {
    expect(slugsOf(await getArticleSummaries("en"))).toEqual([
      "miguel-najdorf",
      "garry-kasparov",
      "dominic-obrien",
      "magnus-carlsen",
      "adriaan-de-groot",
      "judit-polgar",
    ]);
    expect(slugsOf(await getArticleSummaries("de"))).toEqual(["magnus-carlsen", "judit-polgar"]);
    expect(slugsOf(await getTileArticles("de"))).toEqual(["magnus-carlsen", "judit-polgar"]);
    expect(askedSlugs()).not.toContain("adriaan-de-groot");
  });

  it("is skipped by the German next link and kept by the English one", async () => {
    expect((await getNextArticle("magnus-carlsen", "en"))?.slug).toBe("adriaan-de-groot");
    expect((await getNextArticle("magnus-carlsen", "de"))?.slug).toBe("judit-polgar");
    expect((await getNextArticle("judit-polgar", "de"))?.slug).toBe("magnus-carlsen");
    expect(askedSlugs()).not.toContain("adriaan-de-groot");
  });

  it("has no German page and never asks for a German translation", async () => {
    expect(await getArticle("adriaan-de-groot", "de")).toBeUndefined();
    expect((await getArticle("adriaan-de-groot", "en"))?.title).toBe(
      "Adriaan de Groot's 1944 test of chess memory, by the numbers",
    );
    expect(loadArticleText).not.toHaveBeenCalled();
  });

  it("is prerendered in English and not in German", () => {
    expect(generateStaticParams({ params: { locale: "en" } })).toEqual([
      { slug: "miguel-najdorf" },
      { slug: "garry-kasparov" },
      { slug: "dominic-obrien" },
      { slug: "magnus-carlsen" },
      { slug: "adriaan-de-groot" },
      { slug: "judit-polgar" },
    ]);
    expect(generateStaticParams({ params: { locale: "de" } })).toEqual([{ slug: "magnus-carlsen" }, { slug: "judit-polgar" }]);
  });
});
