"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

export const LAB_SECTIONS = {
  notebook: { number: 1, anchor: "notebook" },
  method: { number: 2, anchor: "method" },
  recording: { number: 3, anchor: "recording" },
  calibrate: { number: 4, anchor: "calibrate" },
  tiers: { number: 5, anchor: "difficulty" },
  record: { number: 6, anchor: "record" },
  library: { number: 7, anchor: "library" },
  faq: { number: 8, anchor: "faq" },
  next: { number: 9, anchor: "next-run" },
} as const;

export type LabSectionId = keyof typeof LAB_SECTIONS;

export function SectionIndex({ section }: { section: LabSectionId }) {
  const t = useTranslations("home.lab.sections");
  return (
    <span className="lab-sec-idx">
      §{String(LAB_SECTIONS[section].number).padStart(2, "0")} / {t(section)}
    </span>
  );
}

interface SectionHeadingProps {
  section: LabSectionId;
  title: string;
  lede?: ReactNode;
}

export function SectionHeading({ section, title, lede }: SectionHeadingProps) {
  return (
    <div className="lab-sec-h">
      <SectionIndex section={section} />
      <div>
        <h2>{title}</h2>
        {lede && <p className="lab-lede">{lede}</p>}
      </div>
    </div>
  );
}

export function Ruler() {
  return (
    <div className="lab-wrap">
      <div className="lab-ruler" aria-hidden="true" />
    </div>
  );
}
