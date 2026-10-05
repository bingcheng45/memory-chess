import { ARTICLES, ARTICLE_SLUGS, getArticle, getArticleSummaries, getNextArticle } from "@/lib/articles";
import { textOf } from "@/lib/articles/articleText";
import { loadArticleChrome } from "@/lib/articles/chrome";
import { loadArticleText, type TranslationSource } from "@/lib/articles/translations";
import { markEveryString, reviewedTranslationOf } from "./fixtures";

jest.mock("@/lib/articles/translations", () => ({ loadArticleText: jest.fn() }));
jest.mock("@/lib/articles/chrome", () => ({
  loadArticleChrome: jest.fn(async (locale: string) => {
    if (locale === "fr") throw new Error("Article chrome fr cannot be published: not reviewed");
    return {};
  }),
}));

const SLUG = "magnus-carlsen";
const ENGLISH_TITLE = "How Magnus Carlsen names a famous game from one position";

function englishOf(slug: string) {
  const article = ARTICLES.find((candidate) => candidate.slug === slug);
  if (!article) throw new Error(`no article ${slug}`);
  return article;
}

const everyArticleInGerman: TranslationSource = async (locale, slug) => {
  if (locale !== "de") throw new Error(`no ${locale} translation of ${slug}`);
  return reviewedTranslationOf(englishOf(slug), "DE ", "de");
};

const everyArticleInAnyLocale: TranslationSource = async (locale, slug) =>
  reviewedTranslationOf(englishOf(slug), `${locale.toUpperCase()} `, locale);

const noTranslations: TranslationSource = async (locale, slug) => {
  throw new Error(`no ${locale} translation of ${slug}`);
};

const germanExcept =
  (brokenSlug: string, broken: (file: object) => unknown): TranslationSource =>
  async (locale, slug) => {
    const file = await everyArticleInGerman(locale, slug);
    return slug === brokenSlug ? broken(file as object) : file;
  };

function serveFrom(source: TranslationSource): void {
  const { loadArticleText: actual } = jest.requireActual<typeof import("@/lib/articles/translations")>(
    "@/lib/articles/translations",
  );
  jest.mocked(loadArticleText).mockImplementation((slug, locale, english) => actual(slug, locale, english, source));
}

describe("getArticle in a translated locale", () => {
  it("answers in English without looking for a translation", async () => {
    serveFrom(noTranslations);
    expect(await getArticle(SLUG, "en")).toBe(englishOf(SLUG));
  });

  it("puts the translated words on the article's own slug, dates, photo and links", async () => {
    const english = englishOf(SLUG);
    serveFrom(everyArticleInGerman);
    const german = await getArticle(SLUG, "de");
    if (!german) throw new Error("no German article");

    expect(german.title).toBe(`DE ${ENGLISH_TITLE}`);
    expect(textOf(german)).toStrictEqual(markEveryString(textOf(english), "DE "));
    expect(german.slug).toBe("magnus-carlsen");
    expect(german.publishedAt).toBe("2026-10-03T00:00:00.000Z");
    expect(german.photo.src).toBe("/images/articles/magnus-carlsen.jpg");
    expect(german.photo.licenseUrl).toBe("https://creativecommons.org/licenses/by/4.0");
    expect(german.drill).toMatchObject({ pieceCount: 12, memorizeTime: 5 });
    expect(german.sources.map((source) => source.url)).toEqual(english.sources.map((source) => source.url));
  });

  it("knows no article under an unknown slug, in any locale", async () => {
    serveFrom(everyArticleInGerman);
    expect(await getArticle("no-such-article", "de")).toBeUndefined();
    expect(await getArticle(SLUG, "de")).toHaveProperty("slug", SLUG);
  });

  it.each([
    ["has no file", noTranslations, "Article translation de/magnus-carlsen cannot be read"],
    [
      "was made from an older English text",
      germanExcept(SLUG, (file) => ({ ...file, sourceHash: "0".repeat(64) })),
      "Article translation de/magnus-carlsen cannot be published: sourceHash is stale",
    ],
    [
      "was not reviewed",
      germanExcept(SLUG, (file) => ({ ...file, approvedHash: null })),
      "Article translation de/magnus-carlsen cannot be published: not reviewed",
    ],
  ])("throws, and never answers in English, when the translation %s", async (_, source, message) => {
    serveFrom(source);
    await expect(getArticle(SLUG, "de")).rejects.toThrow(message);
  });
});

describe("getArticleSummaries in a translated locale", () => {
  it("lists every article, newest first, in the words and the date format of that locale", async () => {
    serveFrom(everyArticleInGerman);
    const summaries = await getArticleSummaries("de");

    expect(summaries.map((summary) => summary.slug)).toEqual(ARTICLE_SLUGS);
    expect(summaries.map((summary) => summary.title)).toEqual(ARTICLES.map((article) => `DE ${article.title}`));
    expect(summaries.find((summary) => summary.slug === SLUG)).toMatchObject({
      title: `DE ${ENGLISH_TITLE}`,
      person: { name: "DE Magnus Carlsen", role: "DE World Chess Champion, 2013-2023" },
      publishedAt: "2026-10-03T00:00:00.000Z",
      publishedLabel: "3. Okt. 2026",
      photo: {
        src: "/images/articles/magnus-carlsen.jpg",
        width: 840,
        height: 1050,
        alt: "DE Magnus Carlsen at a press conference in 2025",
      },
    });
  });

  it("lists the English entries with the English date", async () => {
    serveFrom(noTranslations);
    const summaries = await getArticleSummaries("en");

    expect(summaries.find((summary) => summary.slug === SLUG)).toMatchObject({
      title: ENGLISH_TITLE,
      publishedLabel: "Oct 3, 2026",
    });
  });

  it("throws when one article has no reviewed translation, instead of mixing languages", async () => {
    const lastSlug = ARTICLE_SLUGS[ARTICLE_SLUGS.length - 1];
    const source = germanExcept(lastSlug, (file) => ({ ...file, approvedHash: null }));

    serveFrom(source);

    await expect(getArticleSummaries("de")).rejects.toThrow(
      `Article translation de/${lastSlug} cannot be published: not reviewed`,
    );
  });
});

describe("the strings of the section in a translated locale", () => {
  const FRENCH_CHROME = "Article chrome fr cannot be published: not reviewed";
  const chromeChecksOf = (locale: string) => jest.mocked(loadArticleChrome).mock.calls.filter(([asked]) => asked === locale);

  it("stop every article of a locale whose strings cannot be published, although its articles can", async () => {
    serveFrom(everyArticleInAnyLocale);

    await expect(getArticle(SLUG, "fr")).rejects.toThrow(FRENCH_CHROME);
    await expect(getArticleSummaries("fr")).rejects.toThrow(FRENCH_CHROME);
    await expect(getNextArticle(SLUG, "fr")).rejects.toThrow(FRENCH_CHROME);
    expect((await getArticle(SLUG, "it"))?.title).toBe(`IT ${ENGLISH_TITLE}`);
  });

  it("are checked once for a locale, however many articles are read, and never for English", async () => {
    serveFrom(everyArticleInAnyLocale);

    await getArticleSummaries("pl");
    await getArticle(SLUG, "pl");
    await getNextArticle(SLUG, "pl");
    await getArticleSummaries("en");

    expect(chromeChecksOf("pl")).toEqual([["pl"]]);
    expect(chromeChecksOf("en")).toEqual([]);
  });
});

describe("getNextArticle in a translated locale", () => {
  it("summarises the next article in that locale", async () => {
    const nextSlug = ARTICLE_SLUGS[(ARTICLE_SLUGS.indexOf(SLUG) + 1) % ARTICLE_SLUGS.length];
    serveFrom(everyArticleInGerman);
    const next = await getNextArticle(SLUG, "de");

    expect(next?.slug).toBe(nextSlug);
    expect(next?.title).toBe(`DE ${englishOf(nextSlug).title}`);
    expect(next?.publishedLabel).toBe("3. Okt. 2026");
    expect(await getNextArticle("no-such-article", "de")).toBeUndefined();
  });

  it("throws when the next article has no translation", async () => {
    serveFrom(noTranslations);

    await expect(getNextArticle(SLUG, "de")).rejects.toThrow(/^Article translation de\/.+ cannot be read$/);
  });
});
