"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
  deriveBests,
  deriveMissMap,
  deriveStreak,
  deriveTrend,
  deriveTypeRecall,
  type MissCell,
} from "@/lib/lab/derive";
import type { PieceLetter, RoundRecordV1 } from "@/lib/lab/record";
import type { LabSummary } from "@/lib/lab/summary";
import { FILES, RANKS } from "@/lib/game/board";
import { mapChessJsPieceToType } from "@/utils/chessPieces";
import { AccuracySparkline, MissLines, MissMap, StreakGrid } from "./LabCharts";

export interface RecordData {
  readonly records: readonly RoundRecordV1[];
  readonly summary: LabSummary;
  readonly today: string;
}

// Below this share a piece type's bar turns orange, as on the readout card.
const WEAK_RECALL = 0.5;

const missShare = ({ shown, missed, ready }: MissCell) => (ready ? missed / shown : null);

function PanelHead({ fig, tag }: { fig: string; tag: ReactNode }) {
  return (
    <div className="lab-panel-h">
      <span className="lab-k">{fig}</span>
      {tag}
    </div>
  );
}

function useTags() {
  const tags = useTranslations("home.lab.tags");
  const t = useTranslations("home.lab.record");
  return {
    sample: <span className="lab-tag lab-tag-blue">{tags("sample")}</span>,
    mine: <span className="lab-tag lab-tag-mint">{t("mine")}</span>,
  };
}

export function TrendPanel({ records, summary }: RecordData) {
  const t = useTranslations("home.lab.record");
  const tags = useTags();
  const trend = deriveTrend(records);
  const config = trend.config && { pieces: trend.config.pieceCount, seconds: trend.config.memorizeSeconds };

  return (
    <div className="lab-panel lab-p-spark">
      <PanelHead fig={t("spark.fig")} tag={summary.rounds === 0 ? tags.sample : tags.mine} />
      <h3>{t("spark.title")}</h3>
      {summary.rounds === 0 || !config ? (
        <>
          <AccuracySparkline label={t("spark.aria")} first={t("spark.first")} last={t("spark.last")} />
          <p className="lab-note">{t("spark.note")}</p>
        </>
      ) : trend.ready ? (
        <>
          <AccuracySparkline
            points={trend.points}
            label={t("spark.realAria", { count: trend.points.length, latest: trend.points[trend.points.length - 1], ...config })}
            first={t("spark.realFirst")}
            last={t("spark.realLast")}
          />
          <p className="lab-note">
            {t("spark.config", config)} · {t("fromRounds", { count: trend.sampleSize })}
          </p>
        </>
      ) : (
        <p className="lab-panel-desc lab-empty">
          {trend.roundsNeeded > 0
            ? t("spark.needRounds", { count: trend.roundsNeeded, ...config })
            : t("spark.needDay", config)}
        </p>
      )}
    </div>
  );
}

export function MissPanel({ summary }: RecordData) {
  const t = useTranslations("home.lab.record");
  const tags = useTags();
  const proposed = summary.rounds === 0;
  const map = deriveMissMap(summary);
  const lines = (cells: readonly MissCell[], names: readonly string[]) =>
    cells.map((cell, index) => ({
      name: names[index],
      value: missShare(cell),
      label: cell.ready
        ? t("heat.line", { line: names[index], missed: cell.missed, shown: cell.shown })
        : t("heat.lineThin", { line: names[index], shown: cell.shown }),
    }));

  return (
    <div className="lab-panel lab-p-heat">
      <PanelHead fig={t("heat.fig")} tag={proposed ? tags.sample : tags.mine} />
      <h3>{t("heat.title")}</h3>
      {proposed ? (
        <>
          <MissMap label={t("heat.aria")} />
          <p className="lab-note">{t("heat.note")}</p>
        </>
      ) : !map.ready ? (
        <p className="lab-panel-desc lab-empty">
          {map.roundsNeeded === null ? t("heat.needStart") : t("heat.need", { count: map.roundsNeeded })}
        </p>
      ) : (
        <>
          {map.view === "squares" ? (
            <MissMap cells={map.squares.map(missShare)} label={t("heat.realAria")} />
          ) : (
            <>
              <MissLines caption={t("heat.files")} lines={lines(map.files, FILES)} />
              <MissLines caption={t("heat.ranks")} lines={lines(map.ranks, RANKS)} />
            </>
          )}
          <p className="lab-note">
            {t("heat.realNote")} {t("fromRounds", { count: map.sampleSize })}
          </p>
        </>
      )}
    </div>
  );
}

export function StreakPanel({ summary, today }: RecordData) {
  const t = useTranslations("home.lab.record");
  const tags = useTags();
  const proposed = summary.rounds === 0;
  const streak = deriveStreak(summary.days, today);

  return (
    <div className="lab-panel lab-p-streak">
      <PanelHead fig={t("streak.fig")} tag={proposed ? tags.sample : tags.mine} />
      <h3>{proposed ? t("streak.title") : t("streak.realTitle")}</h3>
      <p className="lab-panel-desc">{proposed ? t("streak.desc") : t("streak.realDesc")}</p>
      {proposed ? (
        <>
          <StreakGrid label={t("streak.aria")} />
          <p className="lab-note">{t("streak.note")}</p>
        </>
      ) : (
        <>
          <StreakGrid
            days={streak.window}
            label={t("streak.realAria", { count: streak.window.filter((day) => day === "played").length })}
          />
          <p className="lab-note">
            {streak.ready
              ? `${t("streak.realNote", { current: streak.current, longest: streak.longest })} · ${t("fromRounds", { count: summary.rounds })}`
              : t("streak.need")}
          </p>
        </>
      )}
    </div>
  );
}

export function BestsPanel({ summary }: RecordData) {
  const t = useTranslations("home.lab.record");
  const tags = useTags();
  const bests = deriveBests(summary);

  return (
    <div className="lab-panel lab-p-bests">
      <PanelHead fig={t("bests.fig")} tag={bests.ready ? tags.mine : null} />
      <h3>{t("bests.title")}</h3>
      <p className="lab-panel-desc">{t("bests.desc")}</p>
      {bests.ready ? (
        <>
          <dl className="lab-bests">
            {bests.entries.map((best) => (
              <div key={`${best.source}:${best.pieceCount}x${best.memorizeSeconds}`}>
                <dt>{t("bests.setting", { source: best.source, pieces: best.pieceCount, seconds: best.memorizeSeconds })}</dt>
                <dd>
                  {t("bests.reading", { accuracy: best.accuracy, seconds: (best.solveMs / 1000).toFixed(1) })}
                  {best.rounds === 1 && <span className="lab-note"> · {t("bests.first")}</span>}
                </dd>
              </div>
            ))}
          </dl>
          <p className="lab-note">{t("fromRounds", { count: bests.sampleSize })}</p>
        </>
      ) : (
        <p className="lab-panel-desc lab-empty">{t("bests.empty")}</p>
      )}
    </div>
  );
}

export function TypesPanel({ summary }: RecordData) {
  const t = useTranslations("home.lab.record");
  const pieces = useTranslations("home.lab.calibrate.pieceTypes");
  const tags = useTags();
  const recall = deriveTypeRecall(summary);
  const typeName = (type: PieceLetter) => pieces(mapChessJsPieceToType(type));

  return (
    <div className="lab-panel lab-p-types">
      <PanelHead fig={t("types.fig")} tag={recall.ready ? tags.mine : null} />
      <h3>{t("types.title")}</h3>
      {recall.ready ? (
        <>
          <div className="lab-bars">
            {recall.types.filter(({ shown }) => shown > 0).map(({ type, shown, recalled, ready }) => (
              <div className="lab-bar" key={type} data-thin={ready ? undefined : ""}>
                <span>{typeName(type)}</span>
                <span className="lab-bar-track">
                  {ready && (
                    <i
                      style={{ width: `${Math.round((recalled / shown) * 100)}%` }}
                      data-low={recalled / shown < WEAK_RECALL || undefined}
                    />
                  )}
                </span>
                <span className="lab-bar-value">
                  {ready ? `${Math.round((recalled / shown) * 100)}%` : t("types.thin", { shown })}
                </span>
              </div>
            ))}
          </div>
          <p className="lab-note">{t("fromRounds", { count: recall.sampleSize })}</p>
        </>
      ) : (
        <p className="lab-panel-desc lab-empty">
          {recall.roundsNeeded === null ? t("types.needStart") : t("types.need", { count: recall.roundsNeeded })}
        </p>
      )}
    </div>
  );
}
