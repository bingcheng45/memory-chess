"use client";

import type { ReactNode } from "react";
import type { PieceSymbol } from "chess.js";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import EnglishOnlyLink from "@/components/ui/EnglishOnlyLink";
import { trackEvent } from "@/lib/analytics/events";
import { FILES, RANKS } from "@/lib/game/board";
import { playHref } from "@/lib/game/roundLink";
import { DASHBOARD_PLAY_HREF, type Rig } from "@/lib/lab/dashboard";
import type { TrendSetting } from "@/lib/lab/engine";
import { INSIGHT_GUIDES, type InsightAction } from "@/lib/lab/insights";
import type { LabResults, MissCell, TypeRecall } from "@/lib/lab/metrics";
import { hasFigure, LAB_THRESHOLDS, type Readiness } from "@/lib/lab/readiness";
import { mapChessJsPieceToType } from "@/utils/chessPieces";
import { AccuracySparkline, MissLines, MissMap, RecallBar } from "@/components/home/LabCharts";
import { oneDecimal, ValueLine } from "@/components/home/LabReadingCharts";
import { sentenceValues } from "@/components/home/LabInsightPanels";
import { useNeedText } from "./DashboardTiles";

type Translate = ReturnType<typeof useTranslations<"dashboard.analysis">>;

interface PanelProps {
  readonly name: string;
  readonly title: string;
  /** What the panel shows, in every state, so a panel still waiting for rounds says what will appear. */
  readonly desc: string;
  readonly wide?: boolean;
  readonly children: ReactNode;
}

function Panel({ name, title, desc, wide, children }: PanelProps) {
  return (
    <article className="lab-dash-panel" data-panel={name} data-wide={wide || undefined}>
      <h3>{title}</h3>
      <p className="lab-dash-panel-desc">{desc}</p>
      {children}
    </article>
  );
}

/** A game setting only: the link opens the game, which cannot add a homepage practice round. */
const rigOf = (setting: TrendSetting | undefined): Rig | null =>
  setting?.source === "game" ? { pieceCount: setting.pieceCount, memorizeSeconds: setting.memorizeSeconds } : null;

/** Until a chart can draw, what it still needs and a round that earns it; before any round, an invitation to play. */
function NotYet({ readiness, rig = null }: { readiness: Readiness; rig?: Rig | null }) {
  const t = useTranslations("dashboard");
  const needText = useNeedText();
  if (readiness.state === "warming" && readiness.need) {
    return (
      <div className="lab-dash-wait">
        <p>{needText(readiness.need, rig)}</p>
        {readiness.waitsForTomorrow ? (
          <p className="lab-note">{t("tomorrow")}</p>
        ) : (
          <Link className="lab-tile-go" href={rig ? playHref(rig.pieceCount, rig.memorizeSeconds, "dashboard") : DASHBOARD_PLAY_HREF}>
            {rig ? t("playAt", rig) : t("play")} →
          </Link>
        )}
      </div>
    );
  }
  return (
    <div className="lab-dash-wait">
      <p>{t("notYet")}</p>
      <Link className="lab-tile-go" href={DASHBOARD_PLAY_HREF}>
        {t("play")} →
      </Link>
    </div>
  );
}

function AccuracyPanel({ t, result: { readiness, value } }: { t: Translate; result: LabResults["trend"] }) {
  const drawn = value && hasFigure(readiness) && value.points.length > 1;
  return (
    <Panel name="accuracy" title={t("accuracy.title")} desc={t("accuracy.desc")}>
      {drawn ? (
        <>
          <AccuracySparkline
            points={value.points}
            label={t("accuracy.aria", { count: value.points.length, latest: value.points[value.points.length - 1], ...value.setting })}
            first={t("oldest")}
            last={t("latest")}
          />
          <p className="lab-note">{t("accuracy.note", { ...value.setting, count: value.points.length })}</p>
        </>
      ) : (
        <NotYet readiness={readiness} rig={rigOf(value?.setting)} />
      )}
    </Panel>
  );
}

function SpeedPanel({ t, result: { readiness, value } }: { t: Translate; result: LabResults["speed"] }) {
  const drawn = value && hasFigure(readiness) && value.points.length > 1;
  return (
    <Panel name="speed" title={t("speed.title")} desc={t("speed.unit")}>
      {drawn ? (
        <>
          <ValueLine
            points={value.points}
            label={t("speed.aria", { count: value.points.length, latest: oneDecimal(value.points[value.points.length - 1]), ...value.setting })}
            first={t("oldest")}
            last={t("latest")}
          />
          <p className="lab-note">{t("speed.note", { ...value.setting, count: value.points.length })}</p>
        </>
      ) : (
        <NotYet readiness={readiness} rig={rigOf(value?.setting)} />
      )}
    </Panel>
  );
}

function BestsPanel({ t, result: { readiness, value } }: { t: Translate; result: LabResults["bests"] }) {
  const format = useFormatter();
  const history = useTranslations("dashboard.history");
  return (
    <Panel name="bests" title={t("bests.title")} desc={t("bests.desc")} wide>
      {value && value.entries.length > 0 ? (
        <div className="lab-dash-scroll">
          <table className="lab-dash-table">
            <thead>
              <tr>
                <th scope="col">{t("bests.col.setting")}</th>
                <th scope="col" className="lab-hist-num">{t("bests.col.accuracy")}</th>
                <th scope="col" className="lab-hist-num">{t("bests.col.correct")}</th>
                <th scope="col" className="lab-hist-num">{t("bests.col.time")}</th>
                <th scope="col" className="lab-hist-num">{t("bests.col.rounds")}</th>
                <th scope="col">{t("bests.col.date")}</th>
              </tr>
            </thead>
            <tbody>
              {value.entries.map((best) => (
                <tr key={best.key}>
                  <th scope="row">{t("bests.setting", { source: best.source, pieceCount: best.pieceCount, memorizeSeconds: best.memorizeSeconds })}</th>
                  <td className="lab-hist-num">{format.number(Math.round(best.accuracy))}%</td>
                  <td className="lab-hist-num">{history("correctValue", { correct: best.correct, total: best.pieceCount })}</td>
                  <td className="lab-hist-num">
                    {history("seconds", { value: format.number(best.solveMs / 1000, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) })}
                  </td>
                  <td className="lab-hist-num">{format.number(best.rounds)}</td>
                  <td>{format.dateTime(best.at, { dateStyle: "medium" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <NotYet readiness={readiness} />
      )}
    </Panel>
  );
}

function TypesPanel({ t, result: { readiness, value } }: { t: Translate; result: LabResults["typeRecall"] }) {
  const pieces = useTranslations("game.round.pieceTypes");
  const bar = ({ type, shown, recalled, ready }: TypeRecall, baseline = false) => (
    <RecallBar
      key={type}
      baseline={baseline}
      label={pieces(mapChessJsPieceToType(type as PieceSymbol))}
      share={ready ? recalled / shown : null}
      value={ready ? `${Math.round((recalled / shown) * 100)}%` : t("types.thin", { shown, minimum: LAB_THRESHOLDS.typeExposures })}
    />
  );
  const drawn = value && hasFigure(readiness);
  return (
    <Panel name="types" title={t("types.title")} desc={t("types.desc")}>
      {drawn ? (
        <>
          <div className="lab-bars">
            {value.types.filter(({ shown }) => shown > 0).map((type) => bar(type))}
            {bar(value.king, true)}
          </div>
          <p className="lab-note">{t("types.baseline", { recalled: value.king.recalled, shown: value.king.shown })}</p>
          <p className="lab-note">{t("fromRounds", { count: readiness.sampleSize })}</p>
        </>
      ) : value?.onlyKings ? (
        <p className="lab-dash-wait">{t("types.onlyKings")}</p>
      ) : (
        <NotYet readiness={readiness} />
      )}
    </Panel>
  );
}

const missShare = ({ shown, missed, ready }: MissCell) => (ready ? missed / shown : null);

function MissPanel({ t, result: { readiness, value } }: { t: Translate; result: LabResults["missMap"] }) {
  const minimum = LAB_THRESHOLDS.squareExposures;
  const lines = (cells: readonly MissCell[], names: readonly string[]) =>
    cells.map((cell, index) => ({
      name: names[index],
      value: missShare(cell),
      label: cell.ready ? t("miss.line", { line: names[index], missed: cell.missed, shown: cell.shown }) : t("miss.lineThin", { line: names[index], shown: cell.shown }),
    }));
  const drawn = value && hasFigure(readiness);
  return (
    <Panel name="miss" title={t("miss.title")} desc={t("miss.desc")}>
      {drawn ? (
        <>
          {value.view === "squares" ? (
            <MissMap cells={value.squares.map(missShare)} label={t("miss.aria", { minimum })} />
          ) : (
            <>
              <p className="lab-note">{t("miss.lines", { minimum })}</p>
              <div className="lab-dash-lines">
                <MissLines caption={t("miss.files")} lines={lines(value.files, FILES)} />
                <MissLines caption={t("miss.ranks")} lines={lines(value.ranks, RANKS)} />
              </div>
            </>
          )}
          <p className="lab-note">
            {t("miss.note", { minimum })} {t("fromRounds", { count: readiness.sampleSize })}
          </p>
        </>
      ) : (
        <NotYet readiness={readiness} />
      )}
    </Panel>
  );
}

function ActionLink({ t, action }: { t: Translate; action: InsightAction }) {
  const track = (kind: "play" | "guide") => trackEvent({ name: "lab_panel_action", params: { panel: "insights", action: kind } });
  if (action.kind === "rig") {
    const { pieceCount, memorizeSeconds } = action;
    return (
      <Link className="lab-tile-go" href={playHref(pieceCount, memorizeSeconds, "insight")} onClick={() => track("play")}>
        {t("insights.actions.rig", sentenceValues({ pieceCount, memorizeSeconds }))} →
      </Link>
    );
  }
  return (
    <EnglishOnlyLink className="lab-tile-go" href={`/learn/${INSIGHT_GUIDES[action.guide]}`} onClick={() => track("guide")}>
      {(suffix) => `${t(`insights.actions.${action.guide}`)}${suffix} →`}
    </EnglishOnlyLink>
  );
}

function InsightsPanel({ t, result: { readiness, value } }: { t: Translate; result: LabResults["insights"] }) {
  return (
    <Panel name="insights" title={t("insights.title")} desc={t("insights.desc")} wide>
      {value && hasFigure(readiness) ? (
        value.insights.length === 0 ? (
          <p className="lab-dash-wait">{t("insights.none")}</p>
        ) : (
          <ul className="lab-dash-insights">
            {value.insights.map(({ ruleId, params, action }) => (
              <li key={ruleId}>
                <p>{t(`insights.rules.${ruleId}`, sentenceValues(params))}</p>
                <ActionLink t={t} action={action} />
              </li>
            ))}
          </ul>
        )
      ) : (
        <NotYet readiness={readiness} />
      )}
    </Panel>
  );
}

/** The record read whole: lines over time, bests per setting, recall by piece and square, and what stands out. */
export function DashboardAnalysis({ results }: { results: LabResults | null }) {
  const t = useTranslations("dashboard.analysis");
  if (!results) return <div className="lab-dash-panels lab-dash-pending" aria-hidden="true" />;
  return (
    <div className="lab-dash-panels">
      <AccuracyPanel t={t} result={results.trend} />
      <SpeedPanel t={t} result={results.speed} />
      <BestsPanel t={t} result={results.bests} />
      <TypesPanel t={t} result={results.typeRecall} />
      <MissPanel t={t} result={results.missMap} />
      <InsightsPanel t={t} result={results.insights} />
    </div>
  );
}
