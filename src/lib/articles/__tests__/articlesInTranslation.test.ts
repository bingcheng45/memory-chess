import { DEFAULT_LOCALE } from "@/i18n/routing";
import { ARTICLES, ARTICLE_SLUGS, getArticle, getArticleSummaries, getNextArticle } from "@/lib/articles";
import { textOf } from "@/lib/articles/articleText";
import { TRANSLATED_ARTICLE_LOCALES } from "@/lib/articles/translatedLocales";
import type { TranslationSource } from "@/lib/articles/translations";
import { markEveryString, reviewedTranslationOf } from "./fixtures";

const SLUG = "magnus-carlsen";
const ENGLISH_TITLE = "How Magnus Carlsen names a famous game from one position";

function englishOf(slug: string) {
  const article = ARTICLES.find((candidate) => candidate.slug === slug);
  if (!article) throw new Error(`no article ${slug}`);
  return article;
}

const everyArticleInGerman: TranslationSource = async (locale, slug) => {
  if (locale !== "de") throw new Error(`no ${locale} translation of ${slug}`);
  return reviewedTranslationOf(englishOf(slug), "DE ");
};

const noTranslations: TranslationSource = async (locale, slug) => {
  throw new Error(`no ${locale} translation of ${slug}`);
};

const germanExcept =
  (brokenSlug: string, broken: (file: object) => unknown): TranslationSource =>
  async (locale, slug) => {
    const file = await everyArticleInGerman(locale, slug);
    return slug === brokenSlug ? broken(file as object) : file;
  };

describe("getArticle in a translated locale", () => {
  it("answers in English without looking for a translation", async () => {
    expect(await getArticle(SLUG, "en", noTranslations)).toBe(englishOf(SLUG));
  });

  it("puts the translated words on the article's own slug, dates, photo and links", async () => {
    const english = englishOf(SLUG);
    const german = await getArticle(SLUG, "de", everyArticleInGerman);
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
    expect(await getArticle("no-such-article", "de", everyArticleInGerman)).toBeUndefined();
    expect(await getArticle(SLUG, "de", everyArticleInGerman)).toHaveProperty("slug", SLUG);
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
      germanExcept(SLUG, (file) => ({ ...file, reviewed: false })),
      "Article translation de/magnus-carlsen cannot be published: not reviewed",
    ],
  ])("throws, and never answers in English, when the translation %s", async (_, source, message) => {
    await expect(getArticle(SLUG, "de", source)).rejects.toThrow(message);
  });
});

describe("getArticleSummaries in a translated locale", () => {
  it("lists every article, newest first, in the words and the date format of that locale", async () => {
    const summaries = await getArticleSummaries("de", everyArticleInGerman);

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
    const summaries = await getArticleSummaries("en", noTranslations);

    expect(summaries.find((summary) => summary.slug === SLUG)).toMatchObject({
      title: ENGLISH_TITLE,
      publishedLabel: "Oct 3, 2026",
    });
  });

  it("throws when one article has no reviewed translation, instead of mixing languages", async () => {
    const lastSlug = ARTICLE_SLUGS[ARTICLE_SLUGS.length - 1];
    const source = germanExcept(lastSlug, (file) => ({ ...file, reviewed: false }));

    await expect(getArticleSummaries("de", source)).rejects.toThrow(
      `Article translation de/${lastSlug} cannot be published: not reviewed`,
    );
  });
});

describe("getNextArticle in a translated locale", () => {
  it("summarises the next article in that locale", async () => {
    const nextSlug = ARTICLE_SLUGS[(ARTICLE_SLUGS.indexOf(SLUG) + 1) % ARTICLE_SLUGS.length];
    const next = await getNextArticle(SLUG, "de", everyArticleInGerman);

    expect(next?.slug).toBe(nextSlug);
    expect(next?.title).toBe(`DE ${englishOf(nextSlug).title}`);
    expect(next?.publishedLabel).toBe("3. Okt. 2026");
    expect(await getNextArticle("no-such-article", "de", everyArticleInGerman)).toBeUndefined();
  });

  it("throws when the next article has no translation", async () => {
    await expect(getNextArticle(SLUG, "de", noTranslations)).rejects.toThrow(/^Article translation de\/.+ cannot be read$/);
  });
});

describe("the translations in the repository", () => {
  it("give every locale that serves articles a reviewed, current translation of every article", async () => {
    const translated = TRANSLATED_ARTICLE_LOCALES.filter((locale) => locale !== DEFAULT_LOCALE);
    const pairs = translated.flatMap((locale) => ARTICLES.map((english) => ({ locale, english })));

    const problems = await Promise.all(
      pairs.map(async ({ locale, english }) => {
        try {
          const article = await getArticle(english.slug, locale);
          return article?.title === english.title ? `${locale}/${english.slug}: the title is still English` : null;
        } catch (error) {
          return error instanceof Error ? error.message : String(error);
        }
      }),
    );

    expect(problems.filter((problem) => problem !== null)).toEqual([]);
  });
});
