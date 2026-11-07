import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

export const LAB_SECTIONS = {
  notebook: { anchor: "notebook" },
  method: { anchor: "method" },
  recording: { anchor: "recording" },
  calibrate: { anchor: "calibrate" },
  tiers: { anchor: "difficulty" },
  record: { anchor: "record" },
  library: { anchor: "library" },
  faq: { anchor: "faq" },
  next: { anchor: "next-run" },
} as const;

export type LabSectionId = keyof typeof LAB_SECTIONS;

interface SectionHeadingProps {
  section: LabSectionId;
  title: string;
  lede?: ReactNode;
}

export function SectionHeading({ section, title, lede }: SectionHeadingProps) {
  const t = useTranslations("home.lab.sections");
  return (
    <div className="lab-sec-h">
      <p className="lab-kicker">{t(section)}</p>
      <h2>{title}</h2>
      {lede && <p className="lab-lede">{lede}</p>}
    </div>
  );
}
