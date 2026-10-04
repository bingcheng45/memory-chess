import NextLink from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ARTICLE_LINK } from "@/components/articles/articleStyles";
import { DEFAULT_LOCALE } from "@/i18n/routing";

type TranslationNoteProps = {
  /** The unprefixed path of the English page this one was translated from. */
  englishPath: string;
  className: string;
};

/**
 * Says a page is a translation and links to its English original. Renders
 * nothing on an English page.
 *
 * The link is a plain next/link because the bare URL is the English page. The
 * locale-aware Link would keep the reader's prefix and point back at this page.
 * The paragraph is marked as an authorship note so the AdSense audit does not
 * read the same sentence on every translated page as repeated prose.
 */
export default function TranslationNote({ englishPath, className }: TranslationNoteProps) {
  const t = useTranslations("articles.page");
  const locale = useLocale();
  if (locale === DEFAULT_LOCALE) return null;

  return (
    <p data-authorship-note data-translation-note className={className}>
      {t("translationNote")}{" "}
      <NextLink href={englishPath} hrefLang={DEFAULT_LOCALE} className={ARTICLE_LINK}>
        {t("readInEnglish")}
      </NextLink>
    </p>
  );
}
