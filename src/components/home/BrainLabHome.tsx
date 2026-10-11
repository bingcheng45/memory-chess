"use client";

import { LAB_PAPER_CLASS } from "@/components/lab-paper/shell";
import { LAB_METRICS } from "@/lib/lab/metrics";
import { LAB_THRESHOLDS } from "@/lib/lab/readiness";
import { CalibrationSection } from "./CalibrationSection";
import { FinalCta } from "./FinalCta";
import { HomeStructuredData } from "./HomeStructuredData";
import { LabFaq } from "./LabFaq";
import { LabHomeHeader } from "./LabHomeHeader";
import { LabHero } from "./LabHero";
import { LabRecordSection } from "./LabRecordSection";
import { LabVideo } from "./LabVideo";
import { LibrarySection } from "./LibrarySection";
import { MicroscopeSection } from "./MicroscopeSection";
import { NotebookSection } from "./NotebookSection";
import { TiersSection } from "./TiersSection";
import { useTotalPlays } from "./useLabEffects";
import { useLabRecord } from "./useLabRecord";
import "./lab-paper.css";
import "./lab-instruments.css";

export function BrainLabHome() {
  const totalPlays = useTotalPlays();
  const record = useLabRecord();
  const streak = record.today ? LAB_METRICS.streak.compute(record).value : null;

  return (
    <div className={LAB_PAPER_CLASS}>
      <LabHomeHeader streak={streak && streak.current >= LAB_THRESHOLDS.streakDays ? { days: streak.current, forgiven: streak.forgivenDays.length } : null} />
      <main>
        <HomeStructuredData />
        <LabHero totalPlays={totalPlays} />
        <NotebookSection />
        <MicroscopeSection />
        <LabVideo />
        <CalibrationSection />
        <TiersSection />
        <LabRecordSection record={record} />
        <LibrarySection />
        <LabFaq />
        <FinalCta />
      </main>
    </div>
  );
}
