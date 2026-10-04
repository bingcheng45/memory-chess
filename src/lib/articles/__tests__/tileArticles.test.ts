import { ARTICLES, getTileArticles } from "@/lib/articles";
import { loadArticleText, type TranslationSource } from "@/lib/articles/translations";
import { reviewedTranslationOf } from "./fixtures";

jest.mock("@/lib/articles/translatedLocales");
jest.mock("@/lib/articles/translations", () => ({ loadArticleText: jest.fn() }));

const SLUGS_NEWEST_FIRST = ["magnus-carlsen", "judit-polgar", "adriaan-de-groot"];

const everyArticleInGerman: TranslationSource = async (locale, slug) => {
  const english = ARTICLES.find((article) => article.slug === slug);
  if (locale !== "de" || !english) throw new Error(`no ${locale} translation of ${slug}`);
  return reviewedTranslationOf(english, "DE ");
};

const noTranslations: TranslationSource = async (locale, slug) => {
  throw new Error(`no ${locale} translation of ${slug}`);
};

function serveFrom(source: TranslationSource): void {
  const { loadArticleText: actual } = jest.requireActual<typeof import("@/lib/articles/translations")>(
    "@/lib/articles/translations",
  );
  jest.mocked(loadArticleText).mockImplementation((slug, locale, english) => actual(slug, locale, english, source));
}

describe("getTileArticles", () => {
  it("gives every article in English, with only what the tile shows", async () => {
    serveFrom(noTranslations);

    const articles = await getTileArticles("en");

    expect(articles.map((article) => article.slug).sort()).toEqual([...SLUGS_NEWEST_FIRST].sort());
    expect(articles.find((article) => article.slug === "magnus-carlsen")).toStrictEqual({
      slug: "magnus-carlsen",
      title: "How Magnus Carlsen names a famous game from one position",
      person: { name: "Magnus Carlsen", role: "World Chess Champion, 2013-2023" },
      photo: {
        src: "/images/articles/magnus-carlsen.jpg",
        width: 840,
        height: 1050,
        alt: "Magnus Carlsen at a press conference in 2025",
      },
      drill: {
        pieceCount: 12,
        memorizeTime: 5,
        why: "Five seconds is the exposure Gobet and Simon used in their recall experiment, and 12 pieces give enough material to practice grouping.",
      },
    });
  });

  it("gives the translated words in a locale that serves the articles", async () => {
    serveFrom(everyArticleInGerman);

    const german = (await getTileArticles("de")).find((article) => article.slug === "magnus-carlsen");

    expect(german).toStrictEqual({
      slug: "magnus-carlsen",
      title: "DE How Magnus Carlsen names a famous game from one position",
      person: { name: "DE Magnus Carlsen", role: "DE World Chess Champion, 2013-2023" },
      photo: {
        src: "/images/articles/magnus-carlsen.jpg",
        width: 840,
        height: 1050,
        alt: "DE Magnus Carlsen at a press conference in 2025",
      },
      drill: {
        pieceCount: 12,
        memorizeTime: 5,
        why: "DE Five seconds is the exposure Gobet and Simon used in their recall experiment, and 12 pieces give enough material to practice grouping.",
      },
    });
  });

  it("gives nothing, and reads no translation, for a locale that does not serve the articles", async () => {
    serveFrom(noTranslations);

    expect(await getTileArticles("fr")).toEqual([]);
    expect(await getTileArticles("en")).toHaveLength(3);
  });

  it("fails instead of answering in English when a listed locale has no translation", async () => {
    serveFrom(noTranslations);

    await expect(getTileArticles("de")).rejects.toThrow("Article translation de/");
  });
});
