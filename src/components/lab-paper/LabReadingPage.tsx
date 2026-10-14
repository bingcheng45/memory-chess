import type { ReactNode } from "react";
import englishChrome from "@/lib/pages/readingChrome";
import type { ReadingChrome } from "@/lib/pages/schema";
import { languageTag } from "@/lib/seo/alternates";
import { LabPaperHeader, type PageSections } from "./LabPaperHeader";
import { richText } from "./richText";
import { LAB_PAPER_CLASS } from "./shell";
import "./lab-reading.css";

/** A section of a reading page that its contents list links to by `id`. */
export interface ReadingSection {
  readonly id: string;
  readonly title: string;
}

interface LabReadingPageProps {
  /** The locale the page's text is in, which also sets how the date is written. */
  readonly locale?: string;
  readonly chrome?: ReadingChrome;
  readonly kicker: string;
  readonly title: string;
  readonly lede: ReactNode;
  /** A line under the lede, such as the note that the page is a translation. */
  readonly notice?: ReactNode;
  readonly sections?: PageSections;
  /** The page's sections in order: listed under the lede and in the header's "Contents" menu. */
  readonly contents?: readonly ReadingSection[];
  /** When the page's text last changed, an ISO timestamp, printed as the Singapore calendar date the sitemap reads. */
  readonly updated?: string;
  readonly children: ReactNode;
}

const READING_ZONE = "Asia/Singapore";
const updatedDateTime = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: READING_ZONE });

function updatedLabel(updated: string, locale: string): string {
  const format = { month: "long", day: "numeric", year: "numeric", timeZone: READING_ZONE } as const;
  return new Intl.DateTimeFormat(languageTag(locale), format).format(new Date(updated));
}

function contentsMenu(contents: readonly ReadingSection[], chrome: ReadingChrome): PageSections {
  return {
    trigger: chrome.contents,
    heading: chrome.onThisPage,
    links: contents.map((section) => ({ href: `#${section.id}`, label: section.title })),
  };
}

/** A long-form Lab Paper page: the shell header, then one left-aligned reading column under a kicker, h1 and lede. */
export function LabReadingPage({
  locale = "en",
  chrome = englishChrome,
  kicker,
  title,
  lede,
  notice,
  sections,
  contents,
  updated,
  children,
}: LabReadingPageProps) {
  return (
    <div className={LAB_PAPER_CLASS}>
      <LabPaperHeader sections={sections ?? (contents && contentsMenu(contents, chrome))} />
      <main className="lab-wrap lab-read">
        <header className="lab-read-head">
          <p className="lab-kicker">{kicker}</p>
          <h1>{title}</h1>
          <p className="lab-lede">{lede}</p>
          {notice}
          {updated && (
            <p className="lab-read-updated">
              {richText(chrome.lastUpdated, locale, {
                date: updatedLabel(updated, locale),
                time: (chunks) => <time dateTime={updatedDateTime.format(new Date(updated))}>{chunks}</time>,
              })}
            </p>
          )}
          {contents && (
            <nav className="lab-read-contents" aria-label={chrome.onThisPage}>
              <p className="lab-read-contents-label">{chrome.onThisPage}</p>
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
