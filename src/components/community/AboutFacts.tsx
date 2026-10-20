import { useLocale, useTranslations } from "next-intl";
import { LOCALES } from "@/i18n/routing";
import { readingDateLabel, readingDateTime } from "@/components/lab-paper/readingDate";
import { languageTag } from "@/lib/seo/alternates";
import type { PlayCount } from "@/lib/services/totalPlays";

const COUNT_STEP = 1000;
/** Locales whose sentences follow one another with no space after the full stop. */
const UNSPACED_SENTENCES: ReadonlySet<string> = new Set(["ja", "zh-CN", "zh-TW"]);

/** The About page's facts line. It lives outside the page's gated, translated text, so its words come from the message catalogue. */
export function AboutFacts({ plays }: { readonly plays: PlayCount | null }) {
  const t = useTranslations("common.about");
  const locale = useLocale();
  const floored = plays ? Math.floor(plays.plays / COUNT_STEP) * COUNT_STEP : 0;

  return (
    <p className="lab-read-facts">
      {t("facts", { languages: LOCALES.length })}
      {plays && floored > 0 && (
        <>
          {UNSPACED_SENTENCES.has(locale) ? "" : " "}
          {t.rich("plays", {
            count: new Intl.NumberFormat(languageTag(locale)).format(floored),
            date: readingDateLabel(plays.asOf, locale),
            time: (chunks) => <time dateTime={readingDateTime(plays.asOf)}>{chunks}</time>,
          })}
        </>
      )}
    </p>
  );
}
