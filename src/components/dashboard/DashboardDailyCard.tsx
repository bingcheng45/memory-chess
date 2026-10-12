"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useDailyState } from "@/hooks/useDailyState";
import { DAILY_OPENED_KEY, dailyBoardOf } from "@/lib/lab/daily";
import type { RoundRecord } from "@/lib/lab/record";

const CARD_ID = "lab-dash-daily";

const HIDE_OPENED_CARD_BEFORE_PAINT = `try{if(localStorage.getItem(${JSON.stringify(DAILY_OPENED_KEY)})===new Date().toISOString().slice(0,10))document.getElementById(${JSON.stringify(CARD_ID)}).hidden=true}catch(e){}`;

/** `records` is null until they load. A round restored from another device's backup counts as played here, as on the daily tile. */
export function DashboardDailyCard({ records }: { records: readonly RoundRecord[] | null }) {
  const t = useTranslations("dailyEntry");
  const daily = useDailyState();
  if (daily?.status === "used") return null;
  if (daily && records && dailyBoardOf(records, daily.day, null).status !== "open") return null;

  return (
    <>
      <section id={CARD_ID} className="lab-dash-daily" aria-labelledby={`${CARD_ID}-title`} hidden={daily ? false : undefined} suppressHydrationWarning>
        <div className="lab-dash-daily-text">
          <h2 id={`${CARD_ID}-title`}>{t("cardTitle")}</h2>
          <p className="lab-dash-daily-setting">
            {daily && t("cardSetting", { pieceCount: daily.setting.pieceCount, seconds: daily.setting.memorizeTime })}
          </p>
          <p className="lab-dash-daily-note">{t("cardNote")}</p>
        </div>
        <Link className="lab-btn lab-btn-primary" href="/daily">
          {t("play")}
        </Link>
      </section>
      <script dangerouslySetInnerHTML={{ __html: HIDE_OPENED_CARD_BEFORE_PAINT }} />
    </>
  );
}
