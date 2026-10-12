"use client";

import { useTranslations } from "next-intl";
import { useResetsIn } from "./useResetsIn";

/** The reset moment is the same everywhere, so it is printed on the server; the time left needs the client's clock. */
export function DailyResetLine({ now }: { now: number | null }) {
  const t = useTranslations("daily.page");
  const resetsIn = useResetsIn(now);

  return (
    <p className="daily-reset">
      {resetsIn && <strong data-clock="">{resetsIn}</strong>}
      <span>{t("resets")}</span>
    </p>
  );
}
