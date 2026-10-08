"use client";

import { Fragment, useEffect, useRef, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useLabResults } from "@/hooks/useLabData";
import { trackEvent } from "@/lib/analytics/events";
import { PANEL_ROWS, type CustomRow, type PanelId, type PanelRow } from "@/lib/lab/panels";
import { daysBetween } from "@/lib/lab/readiness";
import { RANKED_DIFFICULTIES } from "@/lib/reference/facts";
import { ForgettingCurve } from "./LabCharts";
import { BestsPanel, figureOf, MissPanel, PanelHead, StreakPanel, TrendPanel, TypesPanel } from "./LabRecordPanels";
import { InsightsPanel, NotebookPanel } from "./LabInsightPanels";
import { HeldPanel, SpanPanel, SpeedPanel } from "./LabReadingPanels";
import { LabRecordTools } from "./LabRecordTools";
import { LabUnlockStrip } from "./LabUnlockStrip";
import type { LabRecord } from "./useLabRecord";
import { LAB_SECTIONS, SectionHeading } from "./SectionHeading";

const PLANS = ["a", "b", "c"] as const;
const BOARD_SKETCH = [
  { rank: "01", width: "86%", pieces: 12 },
  { rank: "02", width: "74%", pieces: 10 },
  { rank: "03", width: "61%", pieces: 8 },
];

function useFirstSight() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some(({ isIntersecting }) => isIntersecting)) return;
      observer.disconnect();
      trackEvent({ name: "lab_section_view", params: {} });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return ref;
}

function CurvePanel() {
  const t = useTranslations("home.lab.record");
  const tags = useTranslations("home.lab.tags");
  return (
    <div className="lab-panel lab-p-curve">
      <PanelHead fig={t("curve.fig", { number: figureOf("curve") })} tag={<span className="lab-tag">{t("curve.tag")}</span>} />
      <h3>{t("curve.title")}</h3>
      <p className="lab-panel-desc">{t("curve.desc")}</p>
      <ForgettingCurve />
      <p className="lab-note">
        <span className="lab-tag lab-tag-blue">{tags("illustrative")}</span> {t("curve.note")}
      </p>
    </div>
  );
}

function BoardPanel() {
  const t = useTranslations("home.lab.record");
  const tags = useTranslations("home.lab.tags");
  const presets = useTranslations("game.presets");
  return (
    <div className="lab-panel lab-p-board">
      <PanelHead fig={t("board.fig", { number: figureOf("board") })} tag={<span className="lab-tag lab-tag-blue">{tags("sample")}</span>} />
      <h3>{t("board.title")}</h3>
      <p className="lab-panel-desc">{t("board.desc")}</p>
      <div className="lab-chips">
        {RANKED_DIFFICULTIES.map((difficulty) => (
          <span key={difficulty}>{presets(`${difficulty}.label`)}</span>
        ))}
      </div>
      <div aria-hidden="true">
        {BOARD_SKETCH.map(({ rank, width, pieces }) => (
          <div className="lab-lb-row" key={rank}>
            <span className="lab-mono">{rank}</span>
            <span className="lab-lb-bar" style={{ width }} />
            <span className="lab-mono lab-note">{t("board.sketchPieces", { count: pieces })}</span>
          </div>
        ))}
      </div>
      <p className="lab-note">
        {t("board.countryFilter")} <span className="lab-tag">{tags("proposed")}</span>
      </p>
      <Link className="lab-go" href="/leaderboard">
        {t("board.open")} →
      </Link>
    </div>
  );
}

function Plans() {
  const t = useTranslations("home.lab.record");
  const tags = useTranslations("home.lab.tags");
  return (
    <div className="lab-plans" data-row="programs">
      {PLANS.map((plan) => (
        <div className="lab-plan" key={plan}>
          <span className="lab-k">
            {t(`plans.${plan}.kicker`)} <span className="lab-tag">{tags("proposed")}</span>
          </span>
          <h3>{t(`plans.${plan}.title`)}</h3>
          <ol>
            {(t.raw(`plans.${plan}.steps`) as string[]).map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}

export function LabRecordSection({ record }: { record: LabRecord }) {
  const t = useTranslations("home.lab.record");
  const { summary, today } = record;
  const lab = useLabResults(record);
  const section = useFirstSight();
  const lastDay = summary.days.at(-1);
  const daysAgo = today && lastDay ? daysBetween(lastDay, today) : null;

  const panels: Record<PanelId, ReactNode> = {
    span: <SpanPanel result={lab.span} daysAgo={daysAgo} />,
    piecesHeld: <HeldPanel result={lab.piecesHeld} daysAgo={daysAgo} />,
    trend: <TrendPanel result={lab.trend} played={summary.rounds > 0} daysAgo={daysAgo} />,
    speed: <SpeedPanel result={lab.speed} daysAgo={daysAgo} />,
    streak: <StreakPanel result={lab.streak} daysAgo={daysAgo} />,
    curve: <CurvePanel />,
    notebook: <NotebookPanel result={lab.notebook} />,
    missMap: <MissPanel result={lab.missMap} daysAgo={daysAgo} />,
    typeRecall: <TypesPanel result={lab.typeRecall} daysAgo={daysAgo} />,
    insights: <InsightsPanel result={lab.insights} daysAgo={daysAgo} />,
    bests: <BestsPanel result={lab.bests} daysAgo={daysAgo} />,
    board: <BoardPanel />,
  };
  const rows: Record<CustomRow, ReactNode> = {
    programs: <Plans key="programs" />,
    tools: (
      <div className="lab-tools-slot" data-row="tools" key="tools">
        <LabRecordTools record={record} />
      </div>
    ),
  };
  const isCustom = (row: PanelRow): row is CustomRow => row in rows;

  return (
    <section className="lab-sec" id={LAB_SECTIONS.record.anchor} ref={section}>
      <div className="lab-wrap">
        <SectionHeading
          section="record"
          title={t("title")}
          lede={t.rich("lede", { tag: (chunks) => <span className="lab-tag lab-tag-blue">{chunks}</span> })}
        />
        <LabUnlockStrip results={lab} storage={record.storage} />
        {PANEL_ROWS.map(({ row, panels: ids }) =>
          isCustom(row) ? (
            rows[row]
          ) : (
            <div className="lab-dash" data-row={row} key={row}>
              {ids.map((id) => (
                <Fragment key={id}>{panels[id]}</Fragment>
              ))}
            </div>
          ),
        )}
      </div>
    </section>
  );
}
