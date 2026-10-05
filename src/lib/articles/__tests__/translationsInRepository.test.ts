import { DEFAULT_LOCALE } from "@/i18n/routing";
import messages from "../../../../messages/en.json";
import { ARTICLES, getArticle } from "@/lib/articles";
import { loadArticleChrome } from "@/lib/articles/chrome";
import { TRANSLATED_ARTICLE_LOCALES } from "@/lib/articles/translatedLocales";

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

  it("give every locale that serves articles approved, current strings for the section", async () => {
    const translated = TRANSLATED_ARTICLE_LOCALES.filter((locale) => locale !== DEFAULT_LOCALE);

    const problems = await Promise.all(
      translated.map(async (locale) => {
        try {
          const chrome = (await loadArticleChrome(locale)) as typeof messages.articles;
          const isEnglish = chrome.page.translationNote === messages.articles.page.translationNote;
          return isEnglish ? `${locale}: the translation note is still English` : null;
        } catch (error) {
          return error instanceof Error ? error.message : String(error);
        }
      }),
    );

    expect(problems.filter((problem) => problem !== null)).toEqual([]);
  });
});
