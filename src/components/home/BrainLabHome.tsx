"use client";

import PageHeader from "@/components/ui/PageHeader";
import FaqSection from "@/components/ui/FaqSection";
import VideoSection from "@/components/ui/VideoSection";
import { LAB_METRICS } from "@/lib/lab/metrics";
import { LAB_THRESHOLDS } from "@/lib/lab/readiness";
import { CalibrationSection } from "./CalibrationSection";
import { FinalCta } from "./FinalCta";
import { HomeStructuredData } from "./HomeStructuredData";
import { LabHero } from "./LabHero";
import { LabIndex } from "./LabIndex";
import { LabRecordSection } from "./LabRecordSection";
import { LibrarySection } from "./LibrarySection";
import { MicroscopeSection } from "./MicroscopeSection";
import { NotebookSection } from "./NotebookSection";
import { LAB_SECTIONS, Ruler, SectionIndex } from "./SectionHeading";
import { TiersSection } from "./TiersSection";
import { useTotalPlays } from "./useLabEffects";
import { useLabRecord } from "./useLabRecord";
import "./lab.css";
import "./lab-instruments.css";

export function BrainLabHome() {
  const totalPlays = useTotalPlays();
  const record = useLabRecord();
  const streak = record.today ? LAB_METRICS.streak.compute(record).value : null;

  return (
    <>
      <div className="container mx-auto flex justify-center px-2 pt-4 sm:px-4">
        <PageHeader showSoundSettings={false} />
      </div>
      <div className="lab">
        <LabIndex streakDays={streak && streak.current >= LAB_THRESHOLDS.streakDays ? streak.current : null} />
        <main>
          <HomeStructuredData />
          <LabHero totalPlays={totalPlays} />
          <Ruler />
          <NotebookSection />
          <MicroscopeSection />
          <section className="lab-sec lab-sec-tight lab-legacy" id={LAB_SECTIONS.recording.anchor}>
            <div className="lab-wrap">
              <SectionIndex section="recording" />
              <VideoSection />
            </div>
          </section>
          <Ruler />
          <CalibrationSection />
          <TiersSection />
          <Ruler />
          <LabRecordSection record={record} />
          <LibrarySection />
          <section className="lab-sec lab-sec-tight lab-legacy" id={LAB_SECTIONS.faq.anchor}>
            <div className="lab-wrap">
              <SectionIndex section="faq" />
              <FaqSection />
            </div>
          </section>
          <FinalCta />
        </main>
      </div>
    </>
  );
}
