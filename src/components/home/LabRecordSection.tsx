"use client";

import { Fragment, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useLabResults } from "@/hooks/useLabData";
import { trackEvent } from "@/lib/analytics/events";
import { PANEL_ROWS, type CustomRow, type PanelId, type PanelRow } from "@/lib/lab/panels";
import { INSTALL_NUDGE_DAYS } from "@/lib/lab/installNudge";
import { readingCardOf } from "@/lib/lab/readingCard";
import { daysBetween } from "@/lib/lab/readiness";
import { welcomeBack } from "@/lib/lab/welcome";
import { BestsPanel, MissPanel, StreakPanel, TrendPanel, TypesPanel } from "./LabRecordPanels";
import { BoardPanel } from "./LabBoardPanel";
import { DailyPanel } from "./LabDailyPanel";
import { InsightsPanel, NotebookPanel } from "./LabInsightPanels";
import { GoalPanel, PlansPanel } from "./LabProgramPanels";
import { HeldPanel, SpanPanel, SpeedPanel } from "./LabReadingPanels";
import { ReviewPanel } from "./LabReviewPanel";
import { LabInstallNudge } from "./LabInstallNudge";
import { LabRecordTools } from "./LabRecordTools";
import { LabUnlockStrip } from "./LabUnlockStrip";
import { planChoice, targetChoice } from "./labChoices";
import { useFirstSight } from "./useFirstSight";
import type { LabRecord } from "./useLabRecord";
import { LAB_SECTIONS, SectionHeading } from "./SectionHeading";

const trackSectionView = () => trackEvent({ name: "lab_section_view", params: {} });

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
    curve: <ReviewPanel result={lab.curve} records={record.records} today={ready ? today : ""} daysAgo={daysAgo} />,
    notebook: <NotebookPanel result={lab.notebook} />,
    missMap: <MissPanel result={lab.missMap} daysAgo={daysAgo} />,
    typeRecall: <TypesPanel result={lab.typeRecall} daysAgo={daysAgo} />,
    insights: <InsightsPanel result={lab.insights} daysAgo={daysAgo} />,
    plans: <PlansPanel result={lab.plans} choosing={ready ? { today, records: record.records, plan } : null} daysAgo={daysAgo} />,
    goal: <GoalPanel result={lab.goal} today={ready ? today : null} daysAgo={daysAgo} />,
    bests: <BestsPanel result={lab.bests} daysAgo={daysAgo} />,
    board: <BoardPanel ready={ready} />,
  };
  const rows: Record<CustomRow, ReactNode> = {
    tools: (
      <div className="lab-tools-slot" data-row="tools" key="tools">
        <LabRecordTools record={record} card={ready ? readingCardOf(lab) : null} />
        {ready && summary.days.length >= INSTALL_NUDGE_DAYS && <LabInstallNudge days={summary.days.length} />}
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
