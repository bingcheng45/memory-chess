// The translation JSON must never reach a client bundle.
import "server-only";
import type { Locale } from "@/i18n/routing";
import { translationProblems } from "./articleText";
import type { ArticleText, ArticleTranslation } from "./schema";

/** Reads one translation file as it is on disk. The result is unchecked. */
export type TranslationSource = (locale: Locale, slug: string) => Promise<unknown>;

const readTranslationFile: TranslationSource = async (locale, slug) =>
  (await import(`./translations/${locale}/${slug}.json`)).default;

async function read(source: TranslationSource, locale: Locale, slug: string): Promise<unknown> {
  try {
    return await source(locale, slug);
  } catch (cause) {
    throw new Error(`Article translation ${locale}/${slug} cannot be read`, { cause });
  }
}

/**
 * The reviewed translation of one article, made from the current English text.
 * Throws when the file is missing, stale, unreviewed or the wrong shape. It
 * never answers with English text.
 */
export async function loadArticleText(
  slug: string,
  locale: Locale,
  english: ArticleText,
  source: TranslationSource = readTranslationFile,
): Promise<ArticleText> {
  const file = await read(source, locale, slug);
  const problems = translationProblems(file, english);

  if (problems.length > 0) {
    throw new Error(`Article translation ${locale}/${slug} cannot be published: ${problems.join("; ")}`);
  }

  return (file as ArticleTranslation).text;
}
