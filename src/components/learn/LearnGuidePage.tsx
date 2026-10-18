import { Link } from "@/i18n/navigation";
import { LabPaperHeader } from "@/components/lab-paper/LabPaperHeader";
import { LAB_PAPER_CLASS } from "@/components/lab-paper/shell";
import { FAQ_ANCHOR, FAQ_LABEL, LEARN_AUTHOR, LEARN_AUTHORSHIP_NOTE, LEARN_LEVELS, type LearnPage } from "@/lib/seo/learn";
import { LEARN_GUIDE_COPY as COPY } from "@/lib/seo/learn/copy";
import { groupAnchor, guidePath } from "@/lib/seo/learn/links";
import { guideStructuredData } from "@/lib/seo/learn/structuredData";
import type { BodyBlock, EndBlock, LearnSection } from "@/lib/seo/learn/schema";
import LearnBlockView, { type TitleLookup } from "./LearnBlockView";
import LearnQuickPlay from "./LearnQuickPlay";
import LearnRailTracker from "./LearnRailTracker";
import "./learn.css";

const AUTHOR_PATH = new URL(LEARN_AUTHOR.url).pathname;

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(value));

const pad = (n: number) => String(n).padStart(2, "0");

function figureNumbers(sections: readonly LearnSection[]): Map<BodyBlock, number> {
  const boards = sections.flatMap((section) => section.blocks).filter((block) => block.kind === "board");
  return new Map(boards.map((block, index) => [block, index + 1]));
}

interface LearnGuidePageProps {
  readonly page: LearnPage;
  /** The other guides in the page's group that its reading list does not already name, in display order. Titles only: a description repeated on every sibling would trip the repeated-sentence rule. */
  readonly siblings: readonly LearnPage[];
  readonly titles: TitleLookup;
}

function Section({ section, figures, titles }: { section: LearnSection; figures: Map<BodyBlock, number>; titles: TitleLookup }) {
  return (
    <section id={section.id} className="lg-section" aria-labelledby={`${section.id}-h`}>
      <h2 id={`${section.id}-h`}>{section.heading}</h2>
      {section.summary ? <p className="lg-summary">{section.summary}</p> : null}
      {section.blocks.map((block, index) => (
        <LearnBlockView key={index} block={block} figure={figures.get(block)} titles={titles} />
      ))}
    </section>
  );
}

function EndPart({ block, titles }: { block: EndBlock; titles: TitleLookup }) {
  switch (block.kind) {
    case "cta":
      return <LearnBlockView block={block} titles={titles} />;
    case "faq":
      return (
        <section id={FAQ_ANCHOR} className="lg-section" aria-labelledby={`${FAQ_ANCHOR}-h`}>
          <h2 id={`${FAQ_ANCHOR}-h`}>{FAQ_LABEL}</h2>
          <LearnBlockView block={block} titles={titles} />
        </section>
      );
    case "furtherReading":
      return (
        <div className="lg-after">
          <p className="lg-after-label">{COPY.readNext}</p>
          <LearnBlockView block={block} titles={titles} />
        </div>
      );
    case "sources":
      return (
        <div className="lg-after">
          <p className="lg-after-label">{COPY.sources}</p>
          <LearnBlockView block={block} titles={titles} />
        </div>
      );
  }
}

export default function LearnGuidePage({ page, siblings, titles }: LearnGuidePageProps) {
  const { meta, intro, group } = page;
  const figures = figureNumbers(page.sections);
  const ctas = page.end.filter((block) => block.kind === "cta");
  const rest = page.end.filter((block) => block.kind !== "cta");

  return (
    <div className={`${LAB_PAPER_CLASS} lg-page`}>
      <LabPaperHeader />
      <div className="lg-progress" aria-hidden="true">
        <span />
      </div>
      <main className="lab-wrap lg-guide" data-learn-guide={meta.slug}>
        <header className="lg-head">
          <nav aria-label="Breadcrumb" className="lg-crumbs">
            <ol>
              <li>
                <Link href="/">{COPY.breadcrumbHome}</Link>
              </li>
              <li>
                <Link href="/learn">{COPY.breadcrumbLearn}</Link>
              </li>
              <li>
                <Link href={groupAnchor(group.id)}>{group.label}</Link>
              </li>
            </ol>
          </nav>
          <h1>{meta.h1}</h1>
          <p className="lg-lede">{meta.description}</p>
          <ul className="lg-meta">
            <li>{LEARN_LEVELS[meta.level]}</li>
            <li>{COPY.minRead(page.readingMinutes)}</li>
            <li>
              <time dateTime={meta.updatedAt}>{COPY.updated(formatDate(meta.updatedAt))}</time>
            </li>
            <li data-learn-byline>
              {COPY.by} <Link href={AUTHOR_PATH}>{LEARN_AUTHOR.name}</Link>
            </li>
          </ul>
          <p data-authorship-note className="lg-note">
            {LEARN_AUTHORSHIP_NOTE}
          </p>
        </header>

        <div className="lg-cols">
          <nav className="lg-rail" aria-labelledby="lg-contents">
            <p id="lg-contents" className="lg-rail-label">
              {COPY.contents}
            </p>
            <ol>
              {page.tableOfContents.map((entry, index) => (
                <li key={entry.id}>
                  <a href={`#${entry.id}`} data-toc={entry.id}>
                    <span className="lg-rail-n">{pad(index + 1)}</span>
                    <span>{entry.label}</span>
                  </a>
                </li>
              ))}
            </ol>
            <p className="lg-rail-all">
              <Link href={groupAnchor(group.id)}>{group.label}</Link> · <Link href="/learn">{COPY.allGuides}</Link>
            </p>
          </nav>

          <div className="lg-main">
            <LearnQuickPlay />
            <section className="lg-answer" aria-labelledby="lg-answer-label">
              <p id="lg-answer-label" className="lg-answer-label">
                {COPY.quickAnswer}
              </p>
              <p className="lg-answer-text">{intro.quickAnswer}</p>
              {intro.takeaways.length > 0 ? (
                <>
                  <p className="lg-answer-label">{COPY.takeaways}</p>
                  <ul>
                    {intro.takeaways.map((takeaway) => (
                      <li key={takeaway}>{takeaway}</li>
                    ))}
                  </ul>
                </>
              ) : null}
              {intro.audience.length > 0 ? (
                <>
                  <p className="lg-answer-label">{COPY.audience}</p>
                  <ul>
                    {intro.audience.map((reader) => (
                      <li key={reader}>{reader}</li>
                    ))}
                  </ul>
                </>
              ) : null}
            </section>

            <div className="lg-body">
              {page.sections.map((section) => (
                <Section key={section.id} section={section} figures={figures} titles={titles} />
              ))}
              <div className="lg-ctas">
                {ctas.map((block, index) => (
                  <EndPart key={index} block={block} titles={titles} />
                ))}
              </div>
              {rest.map((block) => (
                <EndPart key={block.kind} block={block} titles={titles} />
              ))}
              <div className="lg-after">
                <p className="lg-after-label">{group.label}</p>
                {siblings.length > 0 ? (
                  <ul className="lg-siblings">
                    {siblings.map((sibling) => (
                      <li key={sibling.meta.slug}>
                        <Link href={guidePath(sibling.meta.slug)}>{sibling.meta.title}</Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <p className="lg-after-all">
                  <Link href="/learn" className="lg-link">
                    {COPY.allGuides}
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <LearnRailTracker />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(guideStructuredData(page)) }} />
    </div>
  );
}
