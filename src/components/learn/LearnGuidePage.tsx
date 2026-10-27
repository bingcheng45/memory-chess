import NextLink from "next/link";
import { Link } from "@/i18n/navigation";
import { DEFAULT_LOCALE } from "@/i18n/routing";
import { LabPaperHeader } from "@/components/lab-paper/LabPaperHeader";
import { LAB_PAPER_CLASS } from "@/components/lab-paper/shell";
import { newReaderRound } from "@/lib/game/readerRound";
import { FAQ_ANCHOR, LEARN_AUTHOR } from "@/lib/seo/learn";
import { groupAnchor, guidePath } from "@/lib/seo/learn/links";
import type { LocalizedGuide } from "@/lib/seo/learn/load";
import { guideStructuredData } from "@/lib/seo/learn/structuredData";
import type { BodyBlock, EndBlock, LearnSection } from "@/lib/seo/learn/schema";
import GuideLink from "./GuideLink";
import LearnBlockView, { type GuideContext, type TitleLookup } from "./LearnBlockView";
import LearnQuickPlay from "./LearnQuickPlay";
import LearnRailTracker from "./LearnRailTracker";
import LearnTryIt from "./LearnTryIt";
import "./learn.css";

const AUTHOR_PATH = new URL(LEARN_AUTHOR.url).pathname;

const pad = (n: number) => String(n).padStart(2, "0");

function figureNumbers(sections: readonly LearnSection[]): Map<BodyBlock, number> {
  const boards = sections.flatMap((section) => section.blocks).filter((block) => block.kind === "board");
  return new Map(boards.map((block, index) => [block, index + 1]));
}

interface LearnGuidePageProps {
  readonly guide: LocalizedGuide;
  readonly siblingSlugs: readonly string[];
  readonly titles: TitleLookup;
}

type PartProps = { readonly titles: TitleLookup; readonly context: GuideContext };

function Section({ section, figures, titles, context }: PartProps & { section: LearnSection; figures: Map<BodyBlock, number> }) {
  return (
    <section id={section.id} className="lg-section" aria-labelledby={`${section.id}-h`}>
      <h2 id={`${section.id}-h`}>{section.heading}</h2>
      {section.summary ? <p className="lg-summary">{section.summary}</p> : null}
      {section.blocks.map((block, index) => (
        <LearnBlockView key={index} block={block} figure={figures.get(block)} titles={titles} context={context} />
      ))}
    </section>
  );
}

function EndPart({ block, titles, context }: PartProps & { block: EndBlock }) {
  const view = <LearnBlockView block={block} titles={titles} context={context} />;
  switch (block.kind) {
    case "cta":
      return view;
    case "faq":
      return (
        <section id={FAQ_ANCHOR} className="lg-section" aria-labelledby={`${FAQ_ANCHOR}-h`}>
          <h2 id={`${FAQ_ANCHOR}-h`}>{context.copy.faq}</h2>
          {view}
        </section>
      );
    case "furtherReading":
      return (
        <div className="lg-after">
          <p data-interface-label className="lg-after-label">{context.copy.readNext}</p>
          {view}
        </div>
      );
    case "sources":
      return (
        <div className="lg-after">
          <p data-interface-label className="lg-after-label">{context.copy.sources}</p>
          {view}
        </div>
      );
  }
}

export default function LearnGuidePage({ guide, siblingSlugs, titles }: LearnGuidePageProps) {
  const { page, copy: COPY, locale } = guide;
  const context: GuideContext = { copy: COPY, locale };
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
          <nav aria-label={COPY.breadcrumbs} className="lg-crumbs">
            <ol>
              <li>
                <Link href="/">{COPY.breadcrumbHome}</Link>
              </li>
              <li>
                <GuideLink href="/learn" locale={locale}>
                  {COPY.breadcrumbLearn}
                </GuideLink>
              </li>
              <li>
                <GuideLink href={groupAnchor(group.id)} locale={locale}>
                  {group.label}
                </GuideLink>
              </li>
            </ol>
          </nav>
          <h1>{meta.h1}</h1>
          <p className="lg-lede">{meta.description}</p>
          {locale === DEFAULT_LOCALE && meta.practice ? (
            <p className="lg-lede">
              <NextLink href={meta.practice.href} className="lg-link">
                {meta.practice.label}
              </NextLink>
            </p>
          ) : null}
          {page.comparison ? (
            <p className="lg-disclosure" data-compare-disclosure>
              {page.comparison.disclosure}{" "}
              <time dateTime={page.comparison.checkedAt}>{COPY.checked(COPY.date(page.comparison.checkedAt))}</time>.
            </p>
          ) : null}
          <LearnQuickPlay
            unrated={newReaderRound(page.primaryCta)}
            locale={locale}
            copy={{ quickPlay: COPY.quickPlay, tryRound: COPY.chrome.tryRound, dailyBoard: COPY.dailyBoard }}
          />
          <ul className="lg-meta">
            <li>{COPY.level(meta.level)}</li>
            <li>{COPY.minRead(page.readingMinutes)}</li>
            <li>
              <time dateTime={meta.updatedAt}>{COPY.updated(COPY.date(meta.updatedAt))}</time>
            </li>
            <li data-learn-byline>
              {COPY.by} <Link href={AUTHOR_PATH}>{LEARN_AUTHOR.name}</Link>
            </li>
          </ul>
          <p data-authorship-note className="lg-note">
            {COPY.authorshipNote}
          </p>
          {locale === DEFAULT_LOCALE ? null : (
            <p data-translation-note data-authorship-note className="lg-note">
              {COPY.translationNote}{" "}
              <NextLink href={guidePath(meta.slug)} hrefLang={DEFAULT_LOCALE} className="lg-link">
                {COPY.readInEnglish}
              </NextLink>
            </p>
          )}
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
              <GuideLink href={groupAnchor(group.id)} locale={locale}>
                {group.label}
              </GuideLink>{" "}
              ·{" "}
              <GuideLink href="/learn" locale={locale}>
                {COPY.allGuides}
              </GuideLink>
            </p>
          </nav>

          <div className="lg-main">
            <section className="lg-answer" aria-labelledby="lg-answer-label">
              <p id="lg-answer-label" data-interface-label className="lg-answer-label">
                {COPY.quickAnswer}
              </p>
              <p className="lg-answer-text">{intro.quickAnswer}</p>
              {intro.takeaways.length > 0 ? (
                <>
                  <p data-interface-label className="lg-answer-label">{COPY.takeaways}</p>
                  <ul>
                    {intro.takeaways.map((takeaway) => (
                      <li key={takeaway}>{takeaway}</li>
                    ))}
                  </ul>
                </>
              ) : null}
              {intro.audience.length > 0 ? (
                <>
                  <p data-interface-label className="lg-answer-label">{COPY.audience}</p>
                  <ul>
                    {intro.audience.map((reader) => (
                      <li key={reader}>{reader}</li>
                    ))}
                  </ul>
                </>
              ) : null}
            </section>

            {page.tryIt ? <LearnTryIt tryIt={page.tryIt} locale={locale} /> : null}

            <div className="lg-body">
              {page.sections.map((section) => (
                <Section key={section.id} section={section} figures={figures} titles={titles} context={context} />
              ))}
              <div className="lg-ctas">
                {ctas.map((block, index) => (
                  <EndPart key={index} block={block} titles={titles} context={context} />
                ))}
              </div>
              {rest.map((block) => (
                <EndPart key={block.kind} block={block} titles={titles} context={context} />
              ))}
              <div className="lg-after">
                <p data-interface-label className="lg-after-label">{group.label}</p>
                {siblingSlugs.length > 0 ? (
                  <ul className="lg-siblings">
                    {siblingSlugs.map((slug) => (
                      <li key={slug}>
                        <GuideLink href={guidePath(slug)} locale={locale}>
                          {titles.guide(slug)}
                        </GuideLink>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <p className="lg-after-all">
                  <GuideLink href="/learn" locale={locale} className="lg-link">
                    {COPY.allGuides}
                  </GuideLink>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <LearnRailTracker />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(guideStructuredData(page, locale, COPY)),
        }}
      />
    </div>
  );
}
