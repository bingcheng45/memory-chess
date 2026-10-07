"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { LabPanel } from "@/lib/analytics/events";
import type { LabResults, MissCell, TypeRecall } from "@/lib/lab/metrics";
import { hasFigure, type Readiness } from "@/lib/lab/readiness";
import type { PieceSymbol } from "chess.js";
import { FILES, RANKS } from "@/lib/game/board";
import { mapChessJsPieceToType } from "@/utils/chessPieces";
import { formatSeconds } from "@/utils/timer";
import { AccuracySparkline, MissLines, MissMap, RecallBar, StreakGrid } from "./LabCharts";
import { LabPlayLink } from "./LabPlayLink";

const missShare = ({ shown, missed, ready }: MissCell) => (ready ? missed / shown : null);

export function PanelHead({ fig, tag }: { fig: string; tag: ReactNode }) {
  return (
    <div className="lab-panel-h">
      <span className="lab-k">{fig}</span>
      {tag}
    </div>
  );
}

/** The figure stays; the note only says how long ago the last round was. `daysAgo` is null on the server. */
function StaleNote({ readiness, daysAgo, panel }: { readiness: Readiness; daysAgo: number | null; panel: LabPanel }) {
  const t = useTranslations("home.lab.record");
  if (readiness.state !== "stale" || daysAgo === null) return null;
  return (
    <p className="lab-note lab-stale">
      {t("stale", { count: daysAgo })} <LabPlayLink panel={panel} />
    </p>
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

export function TrendPanel({
  result: { readiness, value: trend },
  played,
  daysAgo,
}: {
  result: LabResults["trend"];
  played: boolean;
  daysAgo: number | null;
}) {
  const t = useTranslations("home.lab.record");
  const tags = useTags();
  const need = readiness.need ?? {};

  return (
    <div className="lab-panel lab-p-spark">
      <PanelHead fig={t("spark.fig")} tag={played ? tags.mine : tags.sample} />
      <h3>{t("spark.title")}</h3>
      {!trend ? (
        <>
          <AccuracySparkline label={t("spark.aria")} first={t("spark.first")} last={t("spark.last")} />
          <p className="lab-note">{t("spark.note")}</p>
        </>
      ) : hasFigure(readiness) ? (
        <>
          <AccuracySparkline
            points={trend.points}
            label={t("spark.realAria", { count: trend.points.length, latest: trend.points[trend.points.length - 1], ...trend.setting })}
            first={t("spark.realFirst")}
            last={t("spark.realLast")}
          />
          <p className="lab-note">
            {t("spark.config", trend.setting)} · {t("fromRounds", { count: readiness.sampleSize })}
          </p>
          <StaleNote readiness={readiness} daysAgo={daysAgo} panel="trend" />
        </>
      ) : (
        <p className="lab-panel-desc lab-empty">
          {need.rounds === undefined
            ? t("spark.needDay", trend.setting)
            : t(need.days ? "spark.needRoundsAndDay" : "spark.needRounds", { count: need.rounds, ...trend.setting })}
        </p>
      )}
    </div>
  );
}

export function MissPanel({ result: { readiness, value: map }, daysAgo }: { result: LabResults["missMap"]; daysAgo: number | null }) {
  const t = useTranslations("home.lab.record");
  const tags = useTags();
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
      <PanelHead fig={t("heat.fig")} tag={map ? tags.mine : tags.sample} />
      <h3>{t("heat.title")}</h3>
      {!map ? (
        <>
          <MissMap label={t("heat.aria")} />
          <p className="lab-note">{t("heat.note")}</p>
        </>
      ) : !hasFigure(readiness) ? (
        <p className="lab-panel-desc lab-empty">
          {map.roundsEstimate === null ? t("heat.needStart") : t("heat.need", { count: map.roundsEstimate })}
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
            {t("heat.realNote")} {t("fromRounds", { count: readiness.sampleSize })}
          </p>
          <StaleNote readiness={readiness} daysAgo={daysAgo} panel="missMap" />
        </>
      )}
    </div>
  );
}

export function StreakPanel({ result: { readiness, value: streak }, daysAgo }: { result: LabResults["streak"]; daysAgo: number | null }) {
  const t = useTranslations("home.lab.record");
  const tags = useTags();

  return (
    <div className="lab-panel lab-p-streak">
      <PanelHead fig={t("streak.fig")} tag={streak ? tags.mine : tags.sample} />
      <h3>{t("streak.title")}</h3>
      <p className="lab-panel-desc">{streak ? t("streak.realDesc") : t("streak.desc")}</p>
      {!streak ? (
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
            {hasFigure(readiness)
              ? `${t("streak.realNote", { current: streak.current, longest: streak.longest })} · ${t("fromRounds", { count: readiness.sampleSize })}`
              : t("streak.need")}
          </p>
          <StaleNote readiness={readiness} daysAgo={daysAgo} panel="streak" />
        </>
      )}
    </div>
  );
}

export function BestsPanel({ result: { readiness, value: bests }, daysAgo }: { result: LabResults["bests"]; daysAgo: number | null }) {
  const t = useTranslations("home.lab.record");
  const tags = useTags();

  return (
    <div className="lab-panel lab-p-bests">
      <PanelHead fig={t("bests.fig")} tag={bests ? tags.mine : null} />
      <h3>{t("bests.title")}</h3>
      <p className="lab-panel-desc">{t("bests.desc")}</p>
      {bests ? (
        <>
          <dl className="lab-bests">
            {bests.entries.map((best) => (
              <div key={best.key}>
                <dt>{t("bests.setting", { source: best.source, pieceCount: best.pieceCount, memorizeSeconds: best.memorizeSeconds })}</dt>
                <dd>
                  {t("bests.reading", { accuracy: best.accuracy, seconds: formatSeconds(best.solveMs) })}
                  {best.rounds === 1 && <span className="lab-note"> · {t("bests.first")}</span>}
                </dd>
              </div>
            ))}
          </dl>
          <p className="lab-note">{t("fromRounds", { count: readiness.sampleSize })}</p>
          <StaleNote readiness={readiness} daysAgo={daysAgo} panel="bests" />
        </>
      ) : (
        <p className="lab-panel-desc lab-empty">{t("bests.empty")}</p>
      )}
    </div>
  );
}

export function TypesPanel({ result: { readiness, value: recall }, daysAgo }: { result: LabResults["typeRecall"]; daysAgo: number | null }) {
  const t = useTranslations("home.lab.record");
  const pieces = useTranslations("home.lab.calibrate.pieceTypes");
  const tags = useTags();
  const typeName = (type: PieceSymbol) => pieces(mapChessJsPieceToType(type));
  const kings = (king: TypeRecall) => <p className="lab-note">{t("types.kings", { recalled: king.recalled, shown: king.shown })}</p>;
  const ready = recall && hasFigure(readiness);

  return (
    <div className="lab-panel lab-p-types">
      <PanelHead fig={t("types.fig")} tag={ready ? tags.mine : null} />
      <h3>{t("types.title")}</h3>
      {ready ? (
        <>
          <div className="lab-bars">
            {recall.types.filter(({ shown }) => shown > 0).map(({ type, shown, recalled, ready }) => (
              <RecallBar
                key={type}
                label={typeName(type)}
                share={ready ? recalled / shown : null}
                value={ready ? `${Math.round((recalled / shown) * 100)}%` : t("types.thin", { shown })}
              />
            ))}
          </div>
          {kings(recall.king)}
          <p className="lab-note">{t("fromRounds", { count: readiness.sampleSize })}</p>
          <StaleNote readiness={readiness} daysAgo={daysAgo} panel="typeRecall" />
        </>
      ) : recall?.onlyKings ? (
        <>
          <p className="lab-panel-desc lab-empty">{t("types.onlyKings")}</p>
          {kings(recall.king)}
        </>
      ) : (
        <p className="lab-panel-desc lab-empty">
          {!recall || recall.roundsEstimate === null ? t("types.needStart") : t("types.need", { count: recall.roundsEstimate })}
        </p>
      )}
    </div>
  );
}
