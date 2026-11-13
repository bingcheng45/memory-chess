"use client";

import { useTranslations } from "next-intl";
import { useLabSummary } from "@/hooks/useLabData";
import { Link } from "@/i18n/navigation";
import { LAB_METRICS } from "@/lib/lab/metrics";
import { LAB_THRESHOLDS } from "@/lib/lab/readiness";

/**
 * The current run of days played, on every Lab Paper page once it reaches the streak threshold, linking to the dashboard.
 * Before today's first round the run still counts yesterday, so the chip warns it ends today and links to the daily board.
 */
export function HeaderStreakChip() {
  const t = useTranslations("common.nav");
  const { summary, today } = useLabSummary();
  // The streak reads the summary's days alone, so the log is never read for it.
  const streak = today ? LAB_METRICS.streak.compute({ records: [], summary, today }).value : null;
  if (!streak || streak.current < LAB_THRESHOLDS.streakDays) return null;

  const count = streak.current;
  if (streak.window.at(-1) === "today") {
    const label = t("streakEndsTodayChipLabel", { count });
    return (
      <Link className="lab-streak-chip" href="/daily" prefetch={false} title={label} aria-label={label}>
        {t("streakEndsTodayChip", { count })}
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
