"use client";

import { Fragment, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useLabResults } from "@/hooks/useLabData";
import { trackEvent } from "@/lib/analytics/events";
import { PANEL_ROWS, type CustomRow, type PanelId, type PanelRow } from "@/lib/lab/panels";
import { daysBetween } from "@/lib/lab/readiness";
import { welcomeBack } from "@/lib/lab/welcome";
import { RANKED_DIFFICULTIES } from "@/lib/reference/facts";
import { ForgettingCurve } from "./LabCharts";
import { BestsPanel, figureOf, MissPanel, PanelHead, StreakPanel, TrendPanel, TypesPanel } from "./LabRecordPanels";
import { DailyPanel } from "./LabDailyPanel";
import { InsightsPanel, NotebookPanel } from "./LabInsightPanels";
import { GoalPanel, PlansPanel } from "./LabProgramPanels";
import { HeldPanel, SpanPanel, SpeedPanel } from "./LabReadingPanels";
import { LabRecordTools } from "./LabRecordTools";
import { LabUnlockStrip } from "./LabUnlockStrip";
import { planChoice, targetChoice } from "./labChoices";
import { useFirstSight } from "./useFirstSight";
import type { LabRecord } from "./useLabRecord";
import { LAB_SECTIONS, SectionHeading } from "./SectionHeading";

const BOARD_SKETCH = [
  { rank: "01", width: "86%", pieces: 12 },
  { rank: "02", width: "74%", pieces: 10 },
  { rank: "03", width: "61%", pieces: 8 },
];

const trackSectionView = () => trackEvent({ name: "lab_section_view", params: {} });

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

export function LabRecordSection({ record }: { record: LabRecord }) {
  const t = useTranslations("home.lab.record");
  const { summary, today } = record;
  const storedPlan = planChoice.useValue();
  const storedTarget = targetChoice.useValue();
  // Choices are read only with the record, so the server and a loading tab both show the Sample cards.
  const ready = record.storage === "available" && today !== "";
  const plan = ready ? storedPlan : null;
  const target = ready ? storedTarget : null;
  const lab = useLabResults({ ...record, plan, target });
  const section = useFirstSight<HTMLElement>(trackSectionView);
  const lastDay = summary.days.at(-1);
  const daysAgo = today && lastDay ? daysBetween(lastDay, today) : null;

  const panels: Record<PanelId, ReactNode> = {
    span: <SpanPanel result={lab.span} daysAgo={daysAgo} />,
    piecesHeld: <HeldPanel result={lab.piecesHeld} daysAgo={daysAgo} />,
    trend: <TrendPanel result={lab.trend} played={summary.rounds > 0} daysAgo={daysAgo} />,
    speed: <SpeedPanel result={lab.speed} daysAgo={daysAgo} />,
    daily: <DailyPanel records={record.records} ready={ready} />,
    streak: <StreakPanel result={lab.streak} days={summary.days} today={today} daysAgo={daysAgo} />,
    curve: <CurvePanel />,
    notebook: <NotebookPanel result={lab.notebook} />,
    missMap: <MissPanel result={lab.missMap} daysAgo={daysAgo} />,
    typeRecall: <TypesPanel result={lab.typeRecall} daysAgo={daysAgo} />,
    insights: <InsightsPanel result={lab.insights} daysAgo={daysAgo} />,
    plans: <PlansPanel result={lab.plans} choosing={ready ? { today, records: record.records, plan } : null} daysAgo={daysAgo} />,
    goal: <GoalPanel result={lab.goal} today={ready ? today : null} daysAgo={daysAgo} />,
    bests: <BestsPanel result={lab.bests} daysAgo={daysAgo} />,
    board: <BoardPanel />,
  };
  const rows: Record<CustomRow, ReactNode> = {
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
        <LabUnlockStrip results={lab} storage={record.storage} welcome={record.storage === "available" ? welcomeBack(record) : null} />
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
