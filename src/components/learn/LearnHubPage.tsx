import { Link } from "@/i18n/navigation";
import { LabPaperHeader } from "@/components/lab-paper/LabPaperHeader";
import { LAB_PAPER_CLASS } from "@/components/lab-paper/shell";
import { ARTICLES_PATH } from "@/lib/articles/paths";
import { RECALL_PATH } from "@/lib/data/recall";
import { LEARN_GUIDE_COPY, LEARN_HUB_COPY as COPY, LEARN_SEARCH_COPY } from "@/lib/seo/learn/copy";
import { dashboardTileHref, guidePath, guideRoundHref, learnSearchHref } from "@/lib/seo/learn/links";
import { stageGuideNumber, type LearnStage } from "@/lib/seo/learn/path";
import { hubStructuredData } from "@/lib/seo/learn/structuredData";
import LearnSearch from "./LearnSearch";
import "./learn.css";

const CLOSING_ROUND = { pieceCount: 6, memorizeTime: 10 } as const;

function StageMap({ stages }: { readonly stages: readonly LearnStage[] }) {
  return (
    <nav className="lh-map" aria-label={COPY.stageMap}>
      <ol>
        {stages.map((stage) => (
          <li key={stage.group.id}>
            <a href={`#${stage.group.id}`}>
              <span className="lh-dot">{stage.number}</span>
              <b>{stage.group.label}</b>
              <span className="lh-map-count">{COPY.guideCount(stage.pages.length)}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function Stage({ stage, total }: { readonly stage: LearnStage; readonly total: number }) {
  const headingId = `${stage.group.id}-h`;
  return (
    <section id={stage.group.id} className="lh-stage" aria-labelledby={headingId}>
      <span className="lh-dot lh-stage-dot" aria-hidden="true">
        {stage.number}
      </span>
      <p className="lh-stage-of">{COPY.stageOf(stage.number, total)}</p>
      <h2 id={headingId}>{stage.group.label}</h2>
      <p className="lh-stage-desc">{stage.group.description}</p>
      <ol className="lh-guides">
        {stage.pages.map((page, index) => (
          <li key={page.meta.slug}>
            <Link href={guidePath(page.meta.slug)} className="lh-guide">
              <span className="lh-guide-n">{stageGuideNumber(stage, index)}</span>
              <span className="lh-guide-text">
                <b>{page.meta.title}</b>
                <span>{page.meta.description}</span>
                <span className="lh-guide-meta">
                  {LEARN_GUIDE_COPY.minRead(page.readingMinutes)} · {COPY.endsWith(page.primaryCta)}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
      {stage.cta ? (
        <p className="lh-stage-cta">
          <Link href={stage.cta.href}>{stage.cta.label}</Link>
        </p>
      ) : null}
    </section>
  );
}

export default function LearnHubPage({ stages }: { readonly stages: readonly LearnStage[] }) {
  const pages = stages.flatMap((stage) => stage.pages);
  const asked = pages.filter((page) => page.meta.featured).map((page) => page.meta.questions[0]);

  return (
    <div className={LAB_PAPER_CLASS}>
      <LabPaperHeader />
      <main className="lab-wrap lh-hub">
        <header className="lh-head">
          <p className="lab-kicker">{COPY.kicker}</p>
          <h1>{COPY.title}</h1>
          <p className="lab-lede">{COPY.lede(stages.length)}</p>
        </header>
        <div className="lh-search">
          <LearnSearch stages={stages.map(({ group }) => ({ id: group.id, label: group.label }))} />
          {asked.length > 0 ? (
            <div className="lh-ask">
              <p className="lh-ask-label">{LEARN_SEARCH_COPY.peopleAsk}</p>
              <ul>
                {asked.map((question) => (
                  <li key={question}>
                    <Link href={learnSearchHref(question)}>{question}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
        <StageMap stages={stages} />
        <div className="lh-path">
          {stages.map((stage) => (
            <Stage key={stage.group.id} stage={stage} total={stages.length} />
          ))}
          <section className="lh-stage lh-closing" aria-labelledby="lh-closing-h">
            <span className="lh-dot lh-stage-dot lh-dot-done" aria-hidden="true">
              {"\u2713"}
            </span>
            <h2 id="lh-closing-h">{COPY.closing.title}</h2>
            <p className="lh-stage-desc">{COPY.closing.body}</p>
            <p className="lh-closing-actions">
              <Link href={guideRoundHref(CLOSING_ROUND)} className="lab-btn lab-btn-primary">
                {COPY.closing.play}
              </Link>
              <Link href={ARTICLES_PATH} className="lab-btn lab-btn-secondary">
                {COPY.closing.articles}
              </Link>
              <Link href={dashboardTileHref("days")} className="lh-closing-stat">
                {COPY.closing.stat}
              </Link>
            </p>
            <p className="lh-stage-cta">
              <Link href={RECALL_PATH}>{COPY.closing.data}</Link>
            </p>
          </section>
        </div>
      </main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(hubStructuredData(pages, COPY.meta.title, COPY.meta.description)),
        }}
      />
    </div>
  );
}
