"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import EnglishOnlyLink from "@/components/ui/EnglishOnlyLink";
import { trackEvent } from "@/lib/analytics/events";
import { playHref } from "@/lib/game/roundLink";
import { SAMPLE_EDGE_MISS, SAMPLE_NOTEBOOK } from "@/lib/home/labRecord";
import { EDGE_RIG, INSIGHT_GUIDES, INSIGHTS_THRESHOLDS, type Insight, type InsightAction } from "@/lib/lab/insights";
import type { LabResults } from "@/lib/lab/metrics";
import { FIRST_READING_ACCURACY, type NotebookEntry } from "@/lib/lab/notebook";
import { hasFigure, LAB_THRESHOLDS } from "@/lib/lab/readiness";
import { seconds } from "./labFormat";
import { PanelFrame, StaleNote, useTags } from "./LabRecordPanels";
import { useNotebookSeen } from "./useNotebookSeen";

interface PanelProps<K extends keyof LabResults> {
  readonly result: LabResults[K];
  readonly daysAgo: number | null;
}

type Params = Readonly<Record<string, number | string>>;

/** Seconds print through the record's one formatter, and the window and sample sizes come from the thresholds. */
function sentenceValues(params: Params): Record<string, number | string> {
  const { memorizeSeconds, faster, solveSeconds } = params;
  return {
    ...params,
    window: LAB_THRESHOLDS.rollingWindow,
    minimum: LAB_THRESHOLDS.typeExposures,
    threshold: FIRST_READING_ACCURACY,
    ...(memorizeSeconds !== undefined && { studyTime: seconds(memorizeSeconds) }),
    ...(faster !== undefined && { fasterTime: seconds(faster) }),
    ...(solveSeconds !== undefined && { solveTime: seconds(solveSeconds) }),
  };
}

function ActionLink({ action }: { action: InsightAction }) {
  const t = useTranslations("home.lab.record.insights.actions");
  if (action.kind === "rig") {
    const { pieceCount, memorizeSeconds } = action;
    return (
      <Link
        className="lab-go"
        href={playHref(pieceCount, memorizeSeconds, "insight")}
        onClick={() => trackEvent({ name: "lab_panel_action", params: { panel: "insights", action: "play" } })}
      >
        {t("rig", { pieceCount, studyTime: seconds(memorizeSeconds) })} →
      </Link>
    );
  }
  return (
    <EnglishOnlyLink
      className="lab-go"
      href={`/learn/${INSIGHT_GUIDES[action.guide]}`}
      onClick={() => trackEvent({ name: "lab_panel_action", params: { panel: "insights", action: "guide" } })}
    >
      {(suffix) => `${t(action.guide)}${suffix} →`}
    </EnglishOnlyLink>
  );
}

function Finding({ text, action }: { text: string; action: InsightAction }) {
  return (
    <li>
      <p>{text}</p>
      <ActionLink action={action} />
    </li>
  );
}

export function InsightsPanel({ result: { readiness, value }, daysAgo }: PanelProps<"insights">) {
  const t = useTranslations("home.lab.record");
  const tags = useTags();
  const sentence = ({ ruleId, params }: Insight) => t(`insights.rules.${ruleId}`, sentenceValues(params));

  const body = () => {
    if (!value) {
      const { edge, centre } = SAMPLE_EDGE_MISS;
      return (
        <>
          <ul className="lab-insights" aria-label={t("insights.sampleList")}>
            <Finding text={t("insights.sample", { edge, centre, times: Math.round((edge / centre) * 2) / 2 })} action={{ kind: "rig", ...EDGE_RIG }} />
          </ul>
          <p className="lab-note">{t("insights.sampleNote")}</p>
        </>
      );
    }
    if (!hasFigure(readiness)) {
      return (
        <p className="lab-panel-desc lab-empty">
          {t("insights.need", { threshold: INSIGHTS_THRESHOLDS.rounds, count: readiness.need?.rounds ?? 0 })}
        </p>
      );
    }
    return (
      <>
        {value.insights.length === 0 ? (
          <p className="lab-panel-desc lab-empty">{t("insights.none")}</p>
        ) : (
          <ul className="lab-insights" aria-label={t("insights.list")}>
            {value.insights.map((insight) => (
              <Finding key={insight.ruleId} text={sentence(insight)} action={insight.action} />
            ))}
          </ul>
        )}
        <p className="lab-note">{t("fromRounds", { count: readiness.sampleSize })}</p>
        <StaleNote readiness={readiness} daysAgo={daysAgo} panel="insights" />
      </>
    );
  };

  return (
    <PanelFrame
      panel="insights"
      name="insights"
      tag={value ? tags.mine : tags.sample}
      state={readiness.state}
      intro={<p className="lab-panel-desc">{t("insights.desc")}</p>}
    >
      {body()}
    </PanelFrame>
  );
}

/** Five entries keep the panel one reserved height; the rest render only when the player asks for them. */
const NOTEBOOK_SHOWN = 5;

export function NotebookPanel({ result: { readiness, value } }: { result: LabResults["notebook"] }) {
  const t = useTranslations("home.lab.record");
  const tags = useTags();
  const seenBefore = useNotebookSeen();
  const [expanded, setExpanded] = useState(false);
  const text = ({ kind, params }: Pick<NotebookEntry, "kind" | "params">) => t(`notebook.entries.${kind}`, sentenceValues(params));
  const isNew = ({ at }: NotebookEntry) => seenBefore === null || at > seenBefore;

  const body = () => {
    if (!value) {
      return (
        <>
          <ol className="lab-notebook" aria-label={t("notebook.sampleList")}>
            {SAMPLE_NOTEBOOK.map((entry) => (
              <li key={`${entry.kind}${entry.params.day}`}>{text(entry)}</li>
            ))}
          </ol>
          <p className="lab-note">{t("notebook.empty")}</p>
        </>
      );
    }
    const { entries } = value;
    const shown = expanded ? entries : entries.slice(0, NOTEBOOK_SHOWN);
    return (
      <>
        <ol className="lab-notebook" aria-label={t("notebook.list")} id="lab-notebook-list">
          {shown.map((entry) => (
            <li key={`${entry.kind}${entry.at}`}>
              {text(entry)}
              {isNew(entry) && (
                <>
                  {" "}
                  <span className="lab-tag lab-tag-mint">{t("notebook.new")}</span>
                </>
              )}
            </li>
          ))}
        </ol>
        {entries.length > NOTEBOOK_SHOWN && (
          <button type="button" className="lab-bests-toggle" aria-expanded={expanded} aria-controls="lab-notebook-list" onClick={() => setExpanded(!expanded)}>
            {expanded ? t("notebook.showFewer") : t("notebook.showAll", { count: entries.length })}
          </button>
        )}
        <p className="lab-note">
          {t("fromRounds", { count: readiness.sampleSize })} · {t("notebook.newNote")}
        </p>
      </>
    );
  };

  return (
    <PanelFrame panel="notebook" name="notebook" tag={value ? tags.mine : tags.sample} state={readiness.state}>
      {body()}
    </PanelFrame>
  );
}
