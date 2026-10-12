"use client";

import { useTranslations } from "next-intl";
import { useLabData } from "@/hooks/useLabData";
import { Link } from "@/i18n/navigation";
import { LAB_METRICS } from "@/lib/lab/metrics";
import { LAB_THRESHOLDS } from "@/lib/lab/readiness";

/** The current run of days played, on every Lab Paper page once it reaches the streak threshold, linking to the dashboard. */
export function HeaderStreakChip() {
  const t = useTranslations("common.nav");
  const data = useLabData();
  const streak = data.today ? LAB_METRICS.streak.compute(data).value : null;
  if (!streak || streak.current < LAB_THRESHOLDS.streakDays) return null;

  const label = t("streakChipLabel", { count: streak.current, forgiven: streak.forgivenDays.length });
  return (
    <Link className="lab-streak-chip" href="/dashboard" title={label} aria-label={label}>
      {t("streakChip", { count: streak.current })}
    </Link>
  );
}
