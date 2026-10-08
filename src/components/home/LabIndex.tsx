"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LAB_SECTIONS, type LabSectionId } from "./SectionHeading";
import { QUICK_START_HREF } from "./links";

const INDEX_ENTRIES: readonly Exclude<LabSectionId, "recording" | "faq" | "next">[] = [
  "notebook",
  "method",
  "calibrate",
  "tiers",
  "record",
  "library",
];

/** The current run's days played, and its forgiven days, which the chip names only in its title and accessible name. */
export interface IndexStreak {
  readonly days: number;
  readonly forgiven: number;
}

export function LabIndex({ streak }: { streak: IndexStreak | null }) {
  const t = useTranslations("home.lab.index");
  const record = useTranslations("home.lab.record.streak");
  const forgivenNote = streak && streak.forgiven > 0 ? record("chipForgiven", { count: streak.days, forgiven: streak.forgiven }) : undefined;

  return (
    <div className="lab-index">
      <div className="lab-wrap">
        <span className="lab-index-mark">
          Memory Chess <b>{t("badge")}</b>
        </span>
        <nav aria-label={t("label")}>
          {INDEX_ENTRIES.map((id) => (
            <a key={id} href={`#${LAB_SECTIONS[id].anchor}`}>
              {t(id)}
            </a>
          ))}
        </nav>
        {streak && (
          <a className="lab-streak-chip" href={`#${LAB_SECTIONS.record.anchor}`} title={forgivenNote} aria-label={forgivenNote}>
            {record("chip", { count: streak.days })}
          </a>
        )}
        <Link className="lab-btn lab-btn-primary" href={QUICK_START_HREF}>
          <span className="lab-dot" aria-hidden="true" />
          {t("play")}
        </Link>
      </div>
    </div>
  );
}
