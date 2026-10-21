"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { LOCALES } from "@/i18n/routing";
import { readingDateLabel, readingDateTime } from "@/components/lab-paper/readingDate";
import { languageTag } from "@/lib/seo/alternates";
import { fetchPlayCount, type PlayCount } from "@/lib/stats/playCount";

const COUNT_STEP = 1000;
const UNSPACED_SENTENCES: ReadonlySet<string> = new Set(["ja", "zh-CN", "zh-TW"]);

/** The page is built once, so the count it was built with paints first and the current one replaces it; a failed read keeps it. */
function useCurrentPlays(built: PlayCount | null): PlayCount | null {
  const [plays, setPlays] = useState(built);

  useEffect(() => {
    let cancelled = false;
    fetchPlayCount().then((current) => {
      if (!cancelled && current) setPlays(current);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return plays;
}

export function AboutFacts({ plays: built }: { readonly plays: PlayCount | null }) {
  const plays = useCurrentPlays(built);
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
