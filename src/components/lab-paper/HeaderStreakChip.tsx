"use client";

import { useTranslations } from "next-intl";
import { useLabSummary } from "@/hooks/useLabData";
import { Link } from "@/i18n/navigation";
import { shiftDay } from "@/lib/lab/engine";
import { LAB_METRICS } from "@/lib/lab/metrics";
import { LAB_THRESHOLDS } from "@/lib/lab/readiness";
import { streakOf } from "@/lib/lab/streak";

/**
 * The current run of days played, on every Lab Paper page once it reaches the streak threshold, linking to the dashboard.
 * When skipping today would shorten the run, because no missed day is left to forgive, the chip warns it ends today and
 * links to the daily board. Where the header has no room for the warning's words, lab-header-fit.css swaps them for the
 * day count and the daily board's dot, which takes no room.
 */
export function HeaderStreakChip() {
  const t = useTranslations("common.nav");
  const { summary, today } = useLabSummary();
  // The streak reads the summary's days alone, so the log is never read for it.
  const streak = today ? LAB_METRICS.streak.compute({ records: [], summary, today }).value : null;
  if (!streak || streak.current < LAB_THRESHOLDS.streakDays) return null;

  const count = streak.current;
  if (streakOf(summary.days, shiftDay(today, 1)).current < count) {
    const label = t("streakEndsTodayChipLabel", { count });
    return (
      <Link className="lab-streak-chip" href="/daily" prefetch={false} title={label} aria-label={label}>
        <span className="lab-streak-long">{t("streakEndsTodayChip", { count })}</span>
        <span className="lab-streak-short">
          {t("streakChip", { count })}
          <span className="lab-daily-dot" aria-hidden="true" />
        </span>
      </Link>
    );
  }

  const label = t("streakChipLabel", { count, forgiven: streak.forgivenDays.length });
  return (
    <Link className="lab-streak-chip" href="/dashboard" prefetch={false} title={label} aria-label={label}>
      {t("streakChip", { count })}
    </Link>
  );
}
