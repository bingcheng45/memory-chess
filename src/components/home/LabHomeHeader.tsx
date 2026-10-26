import { useTranslations } from "next-intl";
import { LabPaperHeader, type PageSections } from "@/components/lab-paper/LabPaperHeader";
import { LAB_SECTIONS, type LabSectionId } from "./SectionHeading";

const PAGE_SECTIONS = ["notebook", "method", "calibrate", "tiers", "record", "library"] as const satisfies readonly LabSectionId[];

/** The shared Lab Paper header, with the homepage's "Lab" menu of its six sections. */
export function LabHomeHeader() {
  const t = useTranslations("home.lab.index");
  const sections: PageSections = {
    trigger: t("label"),
    heading: t("onPage"),
    links: PAGE_SECTIONS.map((id) => ({ href: `#${LAB_SECTIONS[id].anchor}`, label: t(id), hint: t(`hints.${id}`) })),
  };

  return <LabPaperHeader sections={sections} playLabel={t("play")} />;
}
