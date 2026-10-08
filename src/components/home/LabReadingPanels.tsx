"use client";

import { useTranslations } from "next-intl";
import { SAMPLE_PARTIAL, SAMPLE_PIECES_HELD, SAMPLE_SPAN, SAMPLE_SPAN_SECONDS, SAMPLE_SPEED, SAMPLE_SPEED_ACCURACY } from "@/lib/home/labRecord";
import { mean } from "@/lib/lab/engine";
import type { LabResults } from "@/lib/lab/metrics";
import type { SpeedValue } from "@/lib/lab/progress";
import { hasFigure, LAB_THRESHOLDS } from "@/lib/lab/readiness";
import { oneDecimal, SpanStaircase, ValueLine } from "./LabReadingCharts";
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
      <p className="lab-span-figure">{t("figure", { pieceCount: SAMPLE_SPAN[SAMPLE_SPAN.length - 1], memorizeSeconds: SAMPLE_SPAN_SECONDS })}</p>
      <p className="lab-span-change" />
      <SpanStaircase steps={SAMPLE_SPAN} label={t("aria")} {...axis} />
      <p className="lab-note">{t("note")}</p>
    </>
  ) : hasFigure(readiness) && span.pieceCount !== null && span.memorizeSeconds !== null ? (
    <>
      <p className="lab-span-figure">{t("figure", { pieceCount: span.pieceCount, memorizeSeconds: span.memorizeSeconds })}</p>
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

/** "up", "down" or "flat" by the change as shown, so a change that rounds to zero never reads as a rise. */
const direction = (change: number) => {
  const shown = Number(oneDecimal(change));
  return shown > 0 ? "up" : shown < 0 ? "down" : "flat";
};

export function HeldPanel({ result: { readiness, value: held }, daysAgo }: PanelProps<"piecesHeld">) {
  const t = useTranslations("home.lab.record.held");
  const record = useTranslations("home.lab.record");
  const tags = useTags();
  const averaged = LAB_THRESHOLDS.movingAverage;
  const axis = { first: t("first"), last: t("last") };
  const legend = <p className="lab-note lab-legend">{t("partial", { window: averaged })}</p>;
  const need = readiness.need ?? {};

  const body = !held ? (
    <>
      <ValueLine points={SAMPLE_PIECES_HELD} partial={SAMPLE_PARTIAL} label={t("aria")} {...axis} />
      {legend}
      <p className="lab-note">{t("note")}</p>
    </>
  ) : hasFigure(readiness) ? (
    <>
      <p className="lab-reading-stat">
        {t("average", { average: oneDecimal(held.recent.average) })}
        {held.recent.change !== null &&
          ` · ${t(direction(held.recent.change), { change: oneDecimal(Math.abs(held.recent.change)), window: LAB_THRESHOLDS.rollingWindow })}`}
      </p>
      <ValueLine
        points={held.movingAverage.map(({ value }) => value)}
        partial={held.movingAverage.filter(({ partial }) => partial).length}
        label={t("realAria", { count: held.points.length, window: averaged, latest: oneDecimal(held.movingAverage[held.movingAverage.length - 1].value) })}
        {...axis}
      />
      {held.movingAverage.some(({ partial }) => partial) && legend}
      <p className="lab-note">{t("realNote", { count: readiness.sampleSize })}</p>
      <StaleNote readiness={readiness} daysAgo={daysAgo} panel="piecesHeld" />
    </>
  ) : (
    <p className="lab-panel-desc lab-empty">
      {need.rounds === undefined ? t("needDay") : t(need.days ? "needRoundsAndDay" : "needRounds", { count: need.rounds })}
    </p>
  );

  return (
    <div className="lab-panel lab-p-held">
      <PanelHead fig={record("held.fig", { number: figureOf("piecesHeld") })} tag={held ? tags.mine : tags.sample} />
      <h3>{t("title")}</h3>
      {body}
    </div>
  );
}

const wholeDirection = (change: number) => {
  const shown = Math.round(change);
  return shown > 0 ? "accuracyUp" : shown < 0 ? "accuracyDown" : "accuracyFlat";
};

function SpeedReading({ speed, axis }: { speed: SpeedValue; axis: { first: string; last: string } }) {
  const t = useTranslations("home.lab.record.speed");
  const { recent, points, setting, accuracyAtSameRounds: accuracy } = speed;
  const faster = recent.change !== null && direction(recent.change) === "down";
  const lessAccurate = accuracy.recent.change !== null && wholeDirection(accuracy.recent.change) === "accuracyDown";

  return (
    <>
      <p className="lab-reading-stat">
        {t("average", { average: oneDecimal(recent.average) })}
        {recent.change !== null &&
          ` · ${t(direction(recent.change), { change: oneDecimal(Math.abs(recent.change)), window: LAB_THRESHOLDS.rollingWindow })}`}
      </p>
      <p className="lab-reading-stat">
        {t("accuracy", { average: Math.round(accuracy.recent.average) })}
        {accuracy.recent.change !== null &&
          ` · ${t(wholeDirection(accuracy.recent.change), { change: Math.round(Math.abs(accuracy.recent.change)) })}`}
      </p>
      <ValueLine points={points} label={t("realAria", { count: points.length, latest: oneDecimal(points[points.length - 1]), ...setting })} {...axis} />
      {faster && lessAccurate && <p className="lab-speed-warn">{t("fastWrong")}</p>}
    </>
  );
}

export function SpeedPanel({ result: { readiness, value: speed }, daysAgo }: PanelProps<"speed">) {
  const t = useTranslations("home.lab.record.speed");
  const record = useTranslations("home.lab.record");
  const tags = useTags();
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
    <div className="lab-panel lab-p-speed">
      <PanelHead fig={record("speed.fig", { number: figureOf("speed") })} tag={speed ? tags.mine : tags.sample} />
      <h3>{t("title")}</h3>
      {body}
    </div>
  );
}
