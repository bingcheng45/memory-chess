"use client";

import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import PageHeader from "@/components/ui/PageHeader";
import FaqSection from "@/components/ui/FaqSection";
import VideoSection from "@/components/ui/VideoSection";
import { CalibrationSection } from "@/components/home/CalibrationSection";
import { FinalCta } from "@/components/home/FinalCta";
import { homeSchema } from "@/components/home/homeSchema";
import { LabHero } from "@/components/home/LabHero";
import { LabIndex } from "@/components/home/LabIndex";
import { LabRecordSection } from "@/components/home/LabRecordSection";
import { LibrarySection } from "@/components/home/LibrarySection";
import { MicroscopeSection } from "@/components/home/MicroscopeSection";
import { NotebookSection } from "@/components/home/NotebookSection";
import { LAB_SECTIONS, Ruler, SectionIndex } from "@/components/home/SectionHeading";
import { TiersSection } from "@/components/home/TiersSection";
import { useTotalPlays } from "@/components/home/useLabEffects";
import { useLabRecord } from "@/components/home/useLabRecord";
import { deriveStreak, LAB_THRESHOLDS } from "@/lib/lab/derive";
import "@/components/home/lab.css";
import "@/components/home/lab-instruments.css";

// Split out so English visitors do not download the earlier homepage's code.
const LegacyHome = dynamic(() => import("@/components/home/LegacyHome").then((module) => module.LegacyHome));

// The lab copy is English only for now. Every other locale keeps the earlier
// homepage, so no locale serves untranslated English text.
const LAB_LOCALES: readonly string[] = ["en"];

export default function Home() {
  const locale = useLocale();
  const t = useTranslations("home.meta");
  const totalPlays = useTotalPlays();
  /*
    Plain script tag, not next/script: `strategy="afterInteractive"` keeps the
    JSON-LD out of the served HTML entirely, so crawlers only see it if they
    execute JS. This matches how the Learn pages already emit their structured
    data.
  */
  const schema = (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeSchema(locale, t("description"))) }} />
  );

  if (!LAB_LOCALES.includes(locale)) return <LegacyHome totalPlays={totalPlays} schema={schema} />;
  return <BrainLab totalPlays={totalPlays} schema={schema} />;
}

function BrainLab({ totalPlays, schema }: { totalPlays: number | null; schema: ReactNode }) {
  const record = useLabRecord();
  const streak = record.today ? deriveStreak(record.summary.days, record.today) : null;

  return (
    <>
      {/* Site chrome stays on the dark ground every other page uses. */}
      <div className="container mx-auto flex justify-center px-2 pt-4 sm:px-4">
        <PageHeader showSoundSettings={false} />
      </div>
      <div className="lab">
        <LabIndex streakDays={streak && streak.current >= LAB_THRESHOLDS.streakDays ? streak.current : null} />
        <main>
          {schema}
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
