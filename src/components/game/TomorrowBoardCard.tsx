"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useDailyState, type DailyState } from "@/hooks/useDailyState";
import { useTimeLeftText } from "@/hooks/useTimeLeftText";
import { nextDailySettingOf } from "@/lib/daily/schedule";

const TITLE_ID = "tomorrow-board-title";

export default function TomorrowBoardCard() {
  const t = useTranslations("dailyEntry");
  const timeLeftText = useTimeLeftText();
  const daily = useDailyState();

  function textOf(state: DailyState) {
    const tomorrow = nextDailySettingOf(state.day);
    const timeLeft = timeLeftText(state.left);
    const opens = `${t("cardSetting", { pieceCount: tomorrow.pieceCount, seconds: tomorrow.memorizeTime })} ${t("tomorrowOpens", { timeLeft })}`;
    const link = state.status === "used" ? t("seeToday") : t("ready", { pieceCount: state.setting.pieceCount, seconds: state.setting.memorizeTime, timeLeft });
    return { opens, link };
  }

  const text = daily && textOf(daily);

  return (
    <section aria-labelledby={TITLE_ID} data-tomorrow-board={daily?.status ?? "pending"} className="lab-card lab-tomorrow">
      <h3 id={TITLE_ID} className="lab-tomorrow-h">
        {t("tomorrowTitle")}
      </h3>
      <p className="lab-tomorrow-text">{text ? text.opens : <span aria-hidden="true">—</span>}</p>
      <Link href="/daily" className="lab-tomorrow-link">
        {text ? text.link : t("pending")}
      </Link>
    </section>
  );
}
