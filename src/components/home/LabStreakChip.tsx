"use client";

import { useTranslations } from "next-intl";
import { LAB_SECTIONS } from "./SectionHeading";

/** The current run's days played, and its forgiven days, which the chip names only in its title and accessible name. */
export interface HeaderStreak {
  readonly days: number;
  readonly forgiven: number;
}

/** The homepage header's link down to the record, counting the current streak. */
export function LabStreakChip({ streak }: { streak: HeaderStreak }) {
  const t = useTranslations("home.lab.record.streak");
  const note = streak.forgiven > 0 ? t("chipForgiven", { count: streak.days, forgiven: streak.forgiven }) : undefined;

  return (
    <a className="lab-streak-chip" href={`#${LAB_SECTIONS.record.anchor}`} title={note} aria-label={note}>
      {t("chip", { count: streak.days })}
    </a>
  );
}
