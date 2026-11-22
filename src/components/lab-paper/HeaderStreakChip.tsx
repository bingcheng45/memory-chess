"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useLabSummary } from "@/hooks/useLabData";
import { Link } from "@/i18n/navigation";
import { streakDaysGroup, trackEvent } from "@/lib/analytics/events";
import { shiftDay } from "@/lib/lab/engine";
import { LAB_METRICS } from "@/lib/lab/metrics";
import { LAB_THRESHOLDS } from "@/lib/lab/readiness";
import { streakOf } from "@/lib/lab/streak";

// Module state outlives client-side navigation, so the view is sent once per page load, not once per page.
let viewSent = false;

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
  const shows = !!streak && streak.current >= LAB_THRESHOLDS.streakDays;
  const count = streak?.current ?? 0;
  const endsToday = shows && streakOf(summary.days, shiftDay(today, 1)).current < count;

  useEffect(() => {
    if (!shows || viewSent) return;
    viewSent = true;
    trackEvent({ name: "streak_chip_view", params: { state: endsToday ? "ends_today" : "active", streak_days: streakDaysGroup(count) } });
  }, [shows, endsToday, count]);

  if (!shows) return null;

  if (endsToday) {
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
