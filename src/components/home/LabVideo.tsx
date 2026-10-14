"use client";

import { useTranslations } from "next-intl";
import TutorialVideoFrame from "@/components/ui/TutorialVideoFrame";
import { LAB_SECTIONS, SectionHeading } from "./SectionHeading";

export function LabVideo() {
  const t = useTranslations("home.video");

  return (
    <section className="lab-sec" id={LAB_SECTIONS.recording.anchor}>
      <div className="lab-wrap lab-video">
        <SectionHeading section="recording" title={t("title")} lede={t("subtitle")} />
        <figure>
          <div className="lab-video-frame">
            <TutorialVideoFrame />
          </div>
          <figcaption className="lab-note">{t("credit")}</figcaption>
        </figure>
      </div>
    </section>
  );
}
