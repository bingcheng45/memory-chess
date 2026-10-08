"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { SAMPLE_WEEK } from "@/lib/home/labRecord";
import { WEEK_GOALS, weekProgress } from "@/lib/lab/week";
import { WeekRing } from "./LabCharts";
import { useWeekGoal } from "./useWeekGoal";

export function SampleWeek() {
  const t = useTranslations("home.lab.record.week");
  const label = t("sampleRing", SAMPLE_WEEK);
  return (
    <div className="lab-week">
      <WeekRing {...SAMPLE_WEEK} label={label} />
      <p aria-hidden="true">{label}</p>
    </div>
  );
}

/** This calendar week's days played against the goal the player sets. Client only: it reads today. */
export function LabWeek({ days, today }: { readonly days: readonly string[]; readonly today: string }) {
  const t = useTranslations("home.lab.record.week");
  const [goal, setGoal] = useWeekGoal();
  const { daysPlayed, remaining, daysLeft } = weekProgress(days, today, goal);
  const label = daysPlayed > goal ? t("ringOver", { played: daysPlayed }) : t("ring", { played: daysPlayed, goal });
  const left = daysPlayed > goal ? null : remaining > daysLeft ? t("outOfReach", { remaining, daysLeft }) : t("left", { remaining });
  const groupLabel = useId();

  return (
    <div className="lab-week">
      <WeekRing played={daysPlayed} goal={goal} label={label} />
      <div>
        <p>
          <b aria-hidden="true">{label}</b> {left}
        </p>
        <div className="lab-goal" role="radiogroup" aria-labelledby={groupLabel}>
          <span id={groupLabel}>{t("goal")}</span>
          {WEEK_GOALS.map((option) => (
            <label key={option}>
              <input type="radio" name={groupLabel} checked={option === goal} onChange={() => setGoal(option)} aria-label={t("option", { days: option })} />
              <span aria-hidden="true">{option}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
