"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useDailyState } from "@/hooks/useDailyState";
import { useTimeLeftText } from "@/hooks/useTimeLeftText";
import { nextDailySettingOf } from "@/lib/daily/schedule";

const TITLE_ID = "tomorrow-board-title";

/** When the next daily board opens and its size, with today's board while it is still unplayed. */
export default function TomorrowBoardCard() {
  const t = useTranslations("dailyEntry");
  const timeLeftText = useTimeLeftText();
  const daily = useDailyState();
  const tomorrow = daily && nextDailySettingOf(daily.day);
  const timeLeft = daily && timeLeftText(daily.left);

  return (
    <section aria-labelledby={TITLE_ID} data-tomorrow-board={daily?.status ?? "pending"} className="lab-card lab-tomorrow">
      <h3 id={TITLE_ID} className="lab-tomorrow-h">
        {t("tomorrowTitle")}
      </h3>
      <p className="lab-tomorrow-text">
        {tomorrow && timeLeft ? (
          <>
            {t("cardSetting", { pieceCount: tomorrow.pieceCount, seconds: tomorrow.memorizeTime })} {t("tomorrowOpens", { timeLeft })}
          </>
        ) : (
          <span aria-hidden="true">—</span>
        )}
      </p>
      <Link href="/daily" className="lab-tomorrow-link">
        {daily?.status === "ready" && timeLeft
          ? t("ready", { pieceCount: daily.setting.pieceCount, seconds: daily.setting.memorizeTime, timeLeft })
          : daily?.status === "used"
            ? t("seeToday")
            : t("pending")}
      </Link>
    </section>
  );
}
