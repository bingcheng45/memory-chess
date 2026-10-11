import type { ReactNode } from "react";
import { LabPaperHeader, type PageSections } from "./LabPaperHeader";
import { LAB_PAPER_CLASS } from "./shell";
import "./lab-reading.css";

interface LabReadingPageProps {
  readonly kicker: string;
  readonly title: string;
  readonly lede: ReactNode;
  readonly sections?: PageSections;
  readonly children: ReactNode;
}

/** A long-form Lab Paper page: the shell header, then one left-aligned reading column under a kicker, h1 and lede. */
export function LabReadingPage({ kicker, title, lede, sections, children }: LabReadingPageProps) {
  return (
    <div className={LAB_PAPER_CLASS}>
      <LabPaperHeader sections={sections} />
      <main className="lab-wrap lab-read">
        <header className="lab-read-head">
          <p className="lab-kicker">{kicker}</p>
          <h1>{title}</h1>
          <p className="lab-lede">{lede}</p>
        </header>
        {children}
      </main>
    </div>
  );
}

/** One titled section of a reading page, its paragraphs set as prose. */
export function LabReadingSection({ title, children }: { readonly title: string; readonly children: ReactNode }) {
  return (
    <section className="lab-read-sec">
      <h2>{title}</h2>
      <div className="lab-prose">{children}</div>
    </section>
  );
}
