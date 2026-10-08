"use client";

import { useTranslations } from "next-intl";
import { SAMPLE_SPAN, SAMPLE_SPAN_SECONDS } from "@/lib/home/labRecord";
import type { LabResults } from "@/lib/lab/metrics";
import { hasFigure, LAB_THRESHOLDS } from "@/lib/lab/readiness";
import { SpanStaircase } from "./LabReadingCharts";
import { figureOf, PanelHead, StaleNote, useTags } from "./LabRecordPanels";

interface PanelProps<K extends keyof LabResults> {
  readonly result: LabResults[K];
  readonly daysAgo: number | null;
}

export function SpanPanel({ result: { readiness, value: span }, daysAgo }: PanelProps<"span">) {
  const t = useTranslations("home.lab.record.span");
  const record = useTranslations("home.lab.record");
  const tags = useTags();
  const axis = { first: t("first"), last: t("last") };

  const steps = span?.history.flatMap(({ pieceCount }) => (pieceCount === null ? [] : [pieceCount])) ?? [];
  const body = !span ? (
    <>
      <p className="lab-span-figure">{t("figure", { pieceCount: SAMPLE_SPAN[SAMPLE_SPAN.length - 1], seconds: SAMPLE_SPAN_SECONDS })}</p>
      <p className="lab-span-change" />
      <SpanStaircase steps={SAMPLE_SPAN} label={t("aria")} {...axis} />
      <p className="lab-note">{t("note")}</p>
    </>
  ) : hasFigure(readiness) && span.pieceCount !== null && span.memorizeSeconds !== null ? (
    <>
      <p className="lab-span-figure">{t("figure", { pieceCount: span.pieceCount, seconds: span.memorizeSeconds })}</p>
      <p className="lab-span-change">{span.change === null ? "" : span.change > 0 ? t("up", { count: span.change }) : t("same")}</p>
      <SpanStaircase
        steps={steps}
        label={t("realAria", {
          sessions: steps.length,
          shape: steps[0] === span.pieceCount ? "flat" : "rising",
          first: steps[0],
          now: span.pieceCount,
        })}
        {...axis}
      />
      <p className="lab-note">
        {t("realNote", {
          rounds: readiness.sampleSize,
          qualifying: span.qualifyingRounds,
          pieceCount: span.pieceCount,
          accuracy: LAB_THRESHOLDS.spanAccuracy,
        })}
      </p>
      <StaleNote readiness={readiness} daysAgo={daysAgo} panel="span" />
    </>
  ) : (
    <p className="lab-panel-desc lab-empty">
      {readiness.need?.largerRounds
        ? t("onlyKings")
        : t("need", {
            count: readiness.need?.qualifyingRounds ?? 0,
            accuracy: LAB_THRESHOLDS.spanAccuracy,
            minPieces: LAB_THRESHOLDS.spanMinPieces,
          })}
    </p>
  );

  return (
    <div className="lab-panel lab-p-span">
      <PanelHead fig={record("span.fig", { number: figureOf("span") })} tag={span ? tags.mine : tags.sample} />
      <h3>{t("title")}</h3>
      {body}
    </div>
  );
}
