"use client";

import PageHeader from "@/components/ui/PageHeader";
import FaqSection from "@/components/ui/FaqSection";
import VideoSection from "@/components/ui/VideoSection";
import { BRAND_ORGANIZATION, BRAND_WEBSITE } from "@/lib/seo/brand";
import { CalibrationSection } from "@/components/home/CalibrationSection";
import { FinalCta } from "@/components/home/FinalCta";
import { LabHero } from "@/components/home/LabHero";
import { LabIndex } from "@/components/home/LabIndex";
import { LabRecordSection } from "@/components/home/LabRecordSection";
import { LibrarySection } from "@/components/home/LibrarySection";
import { MicroscopeSection } from "@/components/home/MicroscopeSection";
import { NotebookSection } from "@/components/home/NotebookSection";
import { LAB_SECTIONS, Ruler, SectionIndex } from "@/components/home/SectionHeading";
import { TiersSection } from "@/components/home/TiersSection";
import { useTotalPlays } from "@/components/home/useLabEffects";
import "@/components/home/lab.css";
import "@/components/home/lab-instruments.css";

const brandSchema = {
  "@context": "https://schema.org",
  "@graph": [BRAND_ORGANIZATION, BRAND_WEBSITE],
};

export default function Home() {
  const totalPlays = useTotalPlays();

  return (
    <>
      {/* Site chrome stays on the dark ground every other page uses. */}
      <div className="container mx-auto flex justify-center px-2 pt-4 sm:px-4">
        <PageHeader showSoundSettings={false} />
      </div>
      <div className="lab">
        <LabIndex />
        <main>
          {/*
            Plain script tag, not next/script: `strategy="afterInteractive"`
            keeps the JSON-LD out of the served HTML entirely, so crawlers only
            see it if they execute JS. This matches how the Learn pages already
            emit their structured data.
          */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(brandSchema) }}
          />
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
          <LabRecordSection />
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
