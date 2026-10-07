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

/** Sticky in-page index for the lab sheet. The site navigation stays in PageHeader above. */
export function LabIndex({ streakDays }: { streakDays: number | null }) {
  const t = useTranslations("home.lab.index");
  const record = useTranslations("home.lab.record.streak");

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
        {streakDays !== null && (
          <a className="lab-streak-chip" href={`#${LAB_SECTIONS.record.anchor}`}>
            {record("chip", { count: streakDays })}
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
