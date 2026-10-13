import type { ReactNode } from "react";
import { LabPaperHeader, type PageSections } from "./LabPaperHeader";
import { LAB_PAPER_CLASS } from "./shell";
import "./lab-reading.css";

/** A section of a reading page that its contents list links to by `id`. */
export interface ReadingSection {
  readonly id: string;
  readonly title: string;
}

interface LabReadingPageProps {
  readonly kicker: string;
  readonly title: string;
  readonly lede: ReactNode;
  readonly sections?: PageSections;
  /** The page's sections in order: listed under the lede and in the header's "Contents" menu. */
  readonly contents?: readonly ReadingSection[];
  /** When the page's text last changed, an ISO timestamp, printed as the Singapore calendar date the sitemap reads. */
  readonly updated?: string;
  readonly children: ReactNode;
}

const READING_ZONE = "Asia/Singapore";
const updatedLabel = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: READING_ZONE });
const updatedDateTime = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: READING_ZONE });

function contentsMenu(contents: readonly ReadingSection[]): PageSections {
  return {
    trigger: "Contents",
    heading: "On this page",
    links: contents.map((section) => ({ href: `#${section.id}`, label: section.title })),
  };
}

/** A long-form Lab Paper page: the shell header, then one left-aligned reading column under a kicker, h1 and lede. */
export function LabReadingPage({ kicker, title, lede, sections, contents, updated, children }: LabReadingPageProps) {
  return (
    <div className={LAB_PAPER_CLASS}>
      <LabPaperHeader sections={sections ?? (contents && contentsMenu(contents))} />
      <main className="lab-wrap lab-read">
        <header className="lab-read-head">
          <p className="lab-kicker">{kicker}</p>
          <h1>{title}</h1>
          <p className="lab-lede">{lede}</p>
          {updated && (
            <p className="lab-read-updated">
              Last updated: <time dateTime={updatedDateTime.format(new Date(updated))}>{updatedLabel.format(new Date(updated))}</time>
            </p>
          )}
          {contents && (
            <nav className="lab-read-contents" aria-label="On this page">
              <p className="lab-read-contents-label">On this page</p>
              <ul>
                {contents.map((section) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`}>{section.title}</a>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </header>
        {children}
      </main>
    </div>
  );
}

/** One titled section of a reading page, its paragraphs set as prose. */
export function LabReadingSection({ title, id, children }: { readonly title: string; readonly id?: string; readonly children: ReactNode }) {
  return (
    <section className="lab-read-sec" id={id}>
      <h2>{title}</h2>
      <div className="lab-prose">{children}</div>
    </section>
  );
}
