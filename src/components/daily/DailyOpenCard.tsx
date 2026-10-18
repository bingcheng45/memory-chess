"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { DailySetting } from "@/lib/daily/schedule";
import { DEFAULT_PRESET } from "@/lib/game/configPrefill";
import { playHref } from "@/lib/game/roundLink";

const PLAY_BEFORE_CLOCK = playHref(DEFAULT_PRESET.pieceCount, DEFAULT_PRESET.memorizeTime, "daily");

const BOARD_CELLS = Array.from({ length: 64 }, (_, index) => (Math.floor(index / 8) + index) % 2);

export function DailyOpenCard({ setting, streak = 0 }: { setting: DailySetting | null; streak?: number }) {
  const t = useTranslations("daily.page");
  return (
    <section className="daily-card" aria-labelledby="daily-card-title" data-state="open">
      <h2 id="daily-card-title" className="daily-card-title">{t("open")}</h2>
      <ul className="daily-facts">
        <li>{setting && t("pieces", { count: setting.pieceCount })}</li>
        <li>{setting && t("seconds", { count: setting.memorizeTime })}</li>
        <li>{t("oneTry")}</li>
      </ul>
      <HiddenBoard />
      <Link className="lab-btn lab-btn-primary daily-play" href={setting ? playHref(setting.pieceCount, setting.memorizeTime, "daily") : PLAY_BEFORE_CLOCK}>
        {t("play")}
      </Link>
      {streak > 0 && <p className="daily-note">{t("streak", { count: streak })}</p>}
    </section>
  );
}

export function HiddenBoard() {
  const t = useTranslations("daily.page");
  return (
    <div className="daily-hidden" role="img" aria-label={t("hidden")}>
      {BOARD_CELLS.map((dark, index) => (
        <i key={index} data-dark={dark === 1 ? "" : undefined} />
      ))}
      <span aria-hidden="true">{t("hidden")}</span>
    </div>
  );
}
