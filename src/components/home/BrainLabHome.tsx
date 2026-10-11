"use client";

import { LAB_METRICS } from "@/lib/lab/metrics";
import { LAB_THRESHOLDS } from "@/lib/lab/readiness";
import { CalibrationSection } from "./CalibrationSection";
import { FinalCta } from "./FinalCta";
import { HomeStructuredData } from "./HomeStructuredData";
import { LabFaq } from "./LabFaq";
import { LabFooter } from "./LabFooter";
import { LabHeader } from "./LabHeader";
import { LabHero } from "./LabHero";
import { LabRecordSection } from "./LabRecordSection";
import { LabVideo } from "./LabVideo";
import { LibrarySection } from "./LibrarySection";
import { MicroscopeSection } from "./MicroscopeSection";
import { NotebookSection } from "./NotebookSection";
import { TiersSection } from "./TiersSection";
import { openSans } from "./labFonts";
import { useTotalPlays } from "./useLabEffects";
import { useLabRecord } from "./useLabRecord";
import "./lab-paper.css";
import "./lab-instruments.css";

export function BrainLabHome() {
  const totalPlays = useTotalPlays();
  const record = useLabRecord();
  const streak = record.today ? LAB_METRICS.streak.compute(record).value : null;

  return (
    <div className={`lab-paper ${openSans.variable}`}>
      <LabHeader streak={streak && streak.current >= LAB_THRESHOLDS.streakDays ? { days: streak.current, forgiven: streak.forgivenDays.length } : null} />
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
      <LabFooter />
    </div>
  );
}
