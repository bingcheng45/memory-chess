import { DEFAULT_LOCALE, LOCALES } from "@/i18n/routing";
import { ARTICLES, getArticle } from "@/lib/articles";
import { TRANSLATED_ARTICLE_LOCALES } from "@/lib/articles/translatedLocales";

describe("the translations in the repository", () => {
  it("serve the articles in every shipped locale, in the order of the routing", () => {
    expect(TRANSLATED_ARTICLE_LOCALES).toEqual(LOCALES);
  });

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
