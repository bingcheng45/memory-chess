import { LAB_PAPER_CLASS } from "@/components/lab-paper/shell";
import { CalibrationSection } from "./CalibrationSection";
import { FinalCta } from "./FinalCta";
import { GAME_VIDEO } from "./gameVideo";
import { HomeStructuredData } from "./HomeStructuredData";
import { LabFaq } from "./LabFaq";
import { LabGameVideo } from "./LabGameVideo";
import { LabHomeHeader } from "./LabHomeHeader";
import { LabHero } from "./LabHero";
import { LabRecord } from "./LabRecord";
import { LabVideo } from "./LabVideo";
import { LibrarySection } from "./LibrarySection";
import { MicroscopeSection } from "./MicroscopeSection";
import { NotebookSection } from "./NotebookSection";
import { TiersSection } from "./TiersSection";
import "./lab-paper.css";
import "./lab-instruments.css";

export function BrainLabHome({ initialPlays }: { readonly initialPlays?: number }) {
  return (
    <div className={LAB_PAPER_CLASS}>
      <LabHomeHeader />
      <main>
        <HomeStructuredData />
        <LabHero initialPlays={initialPlays} />
        <LabGameVideo video={GAME_VIDEO} />
        <NotebookSection />
        <MicroscopeSection />
        <LabVideo />
        <CalibrationSection />
        <TiersSection />
        <LabRecord />
        <LibrarySection />
        <LabFaq />
        <FinalCta />
      </main>
    </div>
  );
}
