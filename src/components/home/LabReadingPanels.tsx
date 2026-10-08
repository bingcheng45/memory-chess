"use client";

import { Fragment, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { SAMPLE_PARTIAL, SAMPLE_PIECES_HELD, SAMPLE_SPAN, SAMPLE_SPAN_SECONDS, SAMPLE_SPEED, SAMPLE_SPEED_ACCURACY } from "@/lib/home/labRecord";
import { mean } from "@/lib/lab/engine";
import type { LabResults } from "@/lib/lab/metrics";
import type { PanelId } from "@/lib/lab/panels";
import type { SpeedValue } from "@/lib/lab/progress";
import { hasFigure, LAB_THRESHOLDS, type Readiness } from "@/lib/lab/readiness";
import { oneDecimal, SpanStaircase, ValueLine } from "./LabReadingCharts";
import { figureOf, PanelHead, StaleNote, useTags } from "./LabRecordPanels";

interface PanelProps<K extends keyof LabResults> {
  readonly result: LabResults[K];
  readonly daysAgo: number | null;
}

interface FrameProps {
  readonly panel: PanelId;
  readonly name: "span" | "held" | "speed";
  readonly readiness: Readiness;
  readonly children: ReactNode;
}

function ReadingFrame({ panel, name, readiness, children }: FrameProps) {
  const t = useTranslations("home.lab.record");
  const tags = useTags();
  return (
    <div className={`lab-panel lab-p-${name}`}>
      <PanelHead fig={t(`${name}.fig`, { number: figureOf(panel) })} tag={readiness.state === "empty" ? tags.sample : tags.mine} />
      <h3>{t(`${name}.title`)}</h3>
      {/* Keyed by state, so new content mounts fresh instead of moving the nodes it replaces. */}
      <Fragment key={readiness.state}>{children}</Fragment>
    </div>
  );
}

/** Rounds the size of a change, half away from zero, so a fall and a rise of the same size print the same digits. */
const roundChange = (change: number, digits: number) => Math.sign(change) * (Math.round(Math.abs(change) * 10 ** digits) / 10 ** digits);
/** By the change as shown, so a change that rounds to zero never reads as a rise. */
const signOf = (shown: number) => (shown > 0 ? "up" : shown < 0 ? "down" : "flat");
const withChange = (stat: string, change: string | null) => (change === null ? stat : `${stat} · ${change}`);

export function SpanPanel({ result: { readiness, value: span }, daysAgo }: PanelProps<"span">) {
  const t = useTranslations("home.lab.record.span");
  const axis = { first: t("first"), last: t("last") };
  const steps = span?.history.flatMap(({ pieceCount }) => (pieceCount === null ? [] : [pieceCount])) ?? [];
  const weekChange = span?.change == null ? "" : span.change > 0 ? t("up", { count: span.change }) : t("same");

  const body = () => {
    if (!span) {
      return (
        <>
          <p className="lab-span-figure">{t("figure", { pieceCount: SAMPLE_SPAN[SAMPLE_SPAN.length - 1], memorizeSeconds: SAMPLE_SPAN_SECONDS })}</p>
          <p className="lab-span-change" />
          <SpanStaircase steps={SAMPLE_SPAN} label={t("aria")} {...axis} />
          <p className="lab-note">{t("note")}</p>
        </>
      );
    }
    const { pieceCount, memorizeSeconds, qualifyingRounds } = span;
    if (!hasFigure(readiness) || pieceCount === null || memorizeSeconds === null) {
      return (
        <p className="lab-panel-desc lab-empty">
          {readiness.need?.largerRounds
            ? t("onlyKings")
            : t("need", { count: readiness.need?.qualifyingRounds ?? 0, accuracy: LAB_THRESHOLDS.spanAccuracy, minPieces: LAB_THRESHOLDS.spanMinPieces })}
        </p>
      );
    }
    return (
      <>
        <p className="lab-span-figure">{t("figure", { pieceCount, memorizeSeconds })}</p>
        <p className="lab-span-change">{weekChange}</p>
        <SpanStaircase
          steps={steps}
          label={t("realAria", { sessions: steps.length, shape: steps[0] === pieceCount ? "flat" : "rising", first: steps[0], now: pieceCount })}
          {...axis}
        />
        <p className="lab-note">
          {t("realNote", { rounds: readiness.sampleSize, qualifying: qualifyingRounds, pieceCount, accuracy: LAB_THRESHOLDS.spanAccuracy })}
        </p>
        <StaleNote readiness={readiness} daysAgo={daysAgo} panel="span" />
      </>
    );
  };

  return (
    <ReadingFrame panel="span" name="span" readiness={readiness}>
      {body()}
    </ReadingFrame>
  );
}

export function HeldPanel({ result: { readiness, value: held }, daysAgo }: PanelProps<"piecesHeld">) {
  const t = useTranslations("home.lab.record.held");
  const averaged = LAB_THRESHOLDS.movingAverage;
  const axis = { first: t("first"), last: t("last") };
  const legend = <p className="lab-note lab-legend">{t("partial", { window: averaged })}</p>;
  const need = readiness.need ?? {};

  const body = () => {
    if (!held) {
      return (
        <>
          <ValueLine points={SAMPLE_PIECES_HELD} partial={SAMPLE_PARTIAL} label={t("aria")} {...axis} />
          {legend}
          <p className="lab-note">{t("note")}</p>
        </>
      );
    }
    if (!hasFigure(readiness)) {
      return (
        <p className="lab-panel-desc lab-empty">
          {need.rounds === undefined ? t("needDay") : t(need.days ? "needRoundsAndDay" : "needRounds", { count: need.rounds })}
        </p>
      );
    }
    const { recent, movingAverage } = held;
    const values = movingAverage.map(({ value }) => value);
    const partial = movingAverage.filter((point) => point.partial).length;
    const change = recent.change === null ? null : roundChange(recent.change, 1);
    return (
      <>
        <p className="lab-reading-stat">
          {withChange(
            t("average", { average: oneDecimal(recent.average) }),
            change === null ? null : t(signOf(change), { change: Math.abs(change).toFixed(1), window: LAB_THRESHOLDS.rollingWindow }),
          )}
        </p>
        <ValueLine
          points={values}
          partial={partial}
          label={t("realAria", { count: held.points.length, window: averaged, latest: oneDecimal(values[values.length - 1]) })}
          {...axis}
        />
        {partial > 0 && legend}
        <p className="lab-note">{t("realNote", { count: readiness.sampleSize })}</p>
        <StaleNote readiness={readiness} daysAgo={daysAgo} panel="piecesHeld" />
      </>
    );
  };

  return (
    <ReadingFrame panel="piecesHeld" name="held" readiness={readiness}>
      {body()}
    </ReadingFrame>
  );
}

function SpeedReading({ speed, axis }: { speed: SpeedValue; axis: { first: string; last: string } }) {
  const t = useTranslations("home.lab.record.speed");
  const { recent, points, setting, accuracyAtSameRounds: accuracy } = speed;
  const pace = recent.change === null ? null : roundChange(recent.change, 1);
  const accuracyChange = accuracy.recent.change === null ? null : roundChange(accuracy.recent.change, 0);
  const fastAndWrong = pace !== null && accuracyChange !== null && pace < 0 && accuracyChange < 0;

  return (
    <>
      <p className="lab-reading-stat">
        {withChange(
          t("average", { average: oneDecimal(recent.average) }),
          pace === null ? null : t(signOf(pace), { change: Math.abs(pace).toFixed(1), window: LAB_THRESHOLDS.rollingWindow }),
        )}
      </p>
      <p className="lab-reading-stat">
        {withChange(
          t("accuracy", { average: Math.round(accuracy.recent.average) }),
          accuracyChange === null ? null : t(`accuracyChange.${signOf(accuracyChange)}`, { change: Math.abs(accuracyChange) }),
        )}
      </p>
      <ValueLine points={points} label={t("realAria", { count: points.length, latest: oneDecimal(points[points.length - 1]), ...setting })} {...axis} />
      {fastAndWrong && <p className="lab-speed-warn">{t("fastWrong")}</p>}
    </>
  );
}

export function SpeedPanel({ result: { readiness, value: speed }, daysAgo }: PanelProps<"speed">) {
  const t = useTranslations("home.lab.record.speed");
  const axis = { first: t("first"), last: t("last") };

  const body = !speed ? (
    <>
      <p className="lab-reading-stat">{t("average", { average: oneDecimal(mean(SAMPLE_SPEED.slice(-LAB_THRESHOLDS.rollingWindow))) })}</p>
      <p className="lab-reading-stat">{t("accuracy", { average: SAMPLE_SPEED_ACCURACY })}</p>
      <ValueLine points={SAMPLE_SPEED} label={t("aria")} {...axis} />
      <p className="lab-note">{t("note")}</p>
    </>
  ) : hasFigure(readiness) ? (
    <>
      <SpeedReading speed={speed} axis={axis} />
      <p className="lab-note">{t("config", { ...speed.setting, count: readiness.sampleSize })}</p>
      <StaleNote readiness={readiness} daysAgo={daysAgo} panel="speed" />
    </>
  ) : (
    <p className="lab-panel-desc lab-empty">{t("need", { count: readiness.need?.rounds ?? 0, ...speed.setting })}</p>
  );

  return (
    <ReadingFrame panel="speed" name="speed" readiness={readiness}>
      {body}
    </ReadingFrame>
  );
}
