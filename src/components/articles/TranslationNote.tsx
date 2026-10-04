import { useLocale, useTranslations } from "next-intl";
import EnglishPageLink from "@/components/articles/EnglishPageLink";
import { DEFAULT_LOCALE } from "@/i18n/routing";

type TranslationNoteProps = {
  englishPath: string;
  className: string;
};

export default function TranslationNote({ englishPath, className }: TranslationNoteProps) {
  const t = useTranslations("articles.page");
  const locale = useLocale();
  if (locale === DEFAULT_LOCALE) return null;

  return (
    <p data-authorship-note data-translation-note className={className}>
      {t("translationNote")} <EnglishPageLink href={englishPath}>{t("readInEnglish")}</EnglishPageLink>
    </p>
  );
}
