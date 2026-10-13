"use client";

import { useId, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { SquareName } from "@/lib/game/board";
import { DASHBOARD_PLAY_HREF } from "@/lib/lab/dashboard";
import { ALL, filterHistory, historyFacets, NO_FILTER, type HistoryFilter, type HistoryRound, type HistorySource } from "@/lib/lab/history";
import { labPositionFromFen, squareVerdict } from "@/lib/round/round";
import { BoardFigure, StaticBoard } from "@/components/round/BoardFigure";

/** Rows drawn at first and added by each "show more". */
export const HISTORY_PAGE = 20;

function useSeconds() {
  const t = useTranslations("dashboard.history");
  const format = useFormatter();
  return (ms: number) => t("seconds", { value: format.number(ms / 1000, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) });
}

function RatingCell({ change }: { change: number | null }) {
  const t = useTranslations("dashboard.history");
  if (change === null) {
    return (
      <>
        <span aria-hidden="true">–</span>
        <span className="lab-sr">{t("unrated")}</span>
      </>
    );
  }
  const sign = change > 0 ? "up" : change < 0 ? "down" : "level";
  const label = sign === "up" ? t("ratingUp", { change }) : sign === "down" ? t("ratingDown", { change: -change }) : t("ratingLevel");
  return (
    <span className="lab-hist-rating" data-sign={sign} aria-label={label}>
      {sign === "up" ? `+${change}` : sign === "down" ? `−${-change}` : "±0"}
    </span>
  );
}

/** The round's board as it was scored: placed pieces, missed ones ghosted where they stood, each square marked. */
function ScoredBoard({ round }: { round: HistoryRound }) {
  const t = useTranslations("dashboard.history");
  const legend = useTranslations("game.round.readout");
  const format = useFormatter();
  const { record } = round;
  const target = labPositionFromFen(record.targetFen);
  const placed = labPositionFromFen(record.placedFen);
  const position = { ...target, ...placed };
  const studied = format.number(record.memorizeMs / 1000, { maximumFractionDigits: 1 });

  return (
    <div className="lab-hist-board">
      <figure className="lab-hist-figure" aria-label={t("boardLabel", { correct: record.correct, total: record.config.pieceCount })}>
        <BoardFigure>
          <StaticBoard
            position={position}
            pieceState={(square: SquareName) => (placed[square] ? "on" : "ghost")}
            mark={(square: SquareName) => squareVerdict(target, placed, square)}
          />
        </BoardFigure>
      </figure>
      <div>
        <p className="lab-hist-detail-text">
          {t("detail", { studied, memorizeSeconds: record.config.memorizeSeconds, wrong: record.wrong, extra: record.extra })}
        </p>
        <div className="lab-legend">
          <span>
            <i data-key="ok" aria-hidden="true" />
            {legend("legendCorrect")}
          </span>
          <span>
            <i data-key="wrong" aria-hidden="true" />
            {legend("legendWrong")}
          </span>
          <span>
            <i data-key="miss" aria-hidden="true" />
            {legend("legendMissed")}
          </span>
        </div>
      </div>
    </div>
  );
}

const COLUMNS = ["date", "source", "setting", "accuracy", "correct", "study", "time", "rating", "board"] as const;
const NUMERIC: readonly (typeof COLUMNS)[number][] = ["accuracy", "correct", "study", "time", "rating"];

function Row({ round, open, onToggle }: { round: HistoryRound; open: boolean; onToggle: () => void }) {
  const t = useTranslations("dashboard.history");
  const format = useFormatter();
  const seconds = useSeconds();
  const detailId = useId();
  const { record } = round;
  const col = (key: (typeof COLUMNS)[number]) => t(`col.${key}`);

  return (
    <>
      <tr data-history-row="" data-source={round.source} data-open={open || undefined}>
        <td data-label={col("date")} className="lab-hist-date">
          <time dateTime={new Date(record.endedAt).toISOString()}>{format.dateTime(record.endedAt, { dateStyle: "medium", timeStyle: "short" })}</time>
        </td>
        <td data-label={col("source")}>
          <span className="lab-hist-source" data-source={round.source}>
            {t(`sources.${round.source}`)}
          </span>
        </td>
        <td data-label={col("setting")}>{t("settingValue", { pieceCount: record.config.pieceCount, memorizeSeconds: record.config.memorizeSeconds })}</td>
        <td data-label={col("accuracy")} className="lab-hist-num">
          <span className="lab-hist-acc">
            <span className="lab-hist-meter" aria-hidden="true">
              <i style={{ width: `${Math.max(0, Math.min(100, record.accuracy))}%` }} />
            </span>
            {format.number(Math.round(record.accuracy))}%
          </span>
        </td>
        <td data-label={col("correct")} className="lab-hist-num">
          {t("correctValue", { correct: record.correct, total: record.config.pieceCount })}
        </td>
        <td data-label={col("study")} className="lab-hist-num">
          {seconds(record.memorizeMs)}
        </td>
        <td data-label={col("time")} className="lab-hist-num">
          {seconds(record.solveMs)}
        </td>
        <td data-label={col("rating")} className="lab-hist-num">
          <RatingCell change={round.ratingChange} />
        </td>
        <td className="lab-hist-end">
          <button type="button" className="lab-btn lab-btn-secondary lab-btn-sm" aria-expanded={open} aria-controls={detailId} onClick={onToggle}>
            {t(open ? "hide" : "show")}
          </button>
        </td>
      </tr>
      <tr className="lab-hist-detail" id={detailId} hidden={!open}>
        <td colSpan={COLUMNS.length}>{open && <ScoredBoard round={round} />}</td>
      </tr>
    </>
  );
}

function Filters({ rounds, filter, onChange }: { rounds: readonly HistoryRound[]; filter: HistoryFilter; onChange: (filter: HistoryFilter) => void }) {
  const t = useTranslations("dashboard.history");
  const { sources, settings } = historyFacets(rounds);
  const sourceId = useId();
  const settingId = useId();
  return (
    <div className="lab-hist-filters">
      <div className="lab-field">
        <label htmlFor={sourceId}>{t("filterSource")}</label>
        <select id={sourceId} value={filter.source} onChange={(event) => onChange({ ...filter, source: event.target.value as HistorySource | typeof ALL })}>
          <option value={ALL}>{t("allSources")}</option>
          {sources.map((source) => (
            <option key={source} value={source}>
              {t(`sources.${source}`)}
            </option>
          ))}
        </select>
      </div>
      <div className="lab-field">
        <label htmlFor={settingId}>{t("filterSetting")}</label>
        <select id={settingId} value={filter.setting} onChange={(event) => onChange({ ...filter, setting: event.target.value })}>
          <option value={ALL}>{t("allSettings")}</option>
          {settings.map(({ key, pieceCount, memorizeSeconds }) => (
            <option key={key} value={key}>
              {t("settingValue", { pieceCount, memorizeSeconds })}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

interface HistoryProps {
  /** Newest first; null until the record is read. */
  readonly rounds: readonly HistoryRound[] | null;
  /** Rounds ever played, which outlasts the capped round log. */
  readonly total: number;
}

export function DashboardHistory({ rounds, total }: HistoryProps) {
  const t = useTranslations("dashboard.history");
  const dashboard = useTranslations("dashboard");
  const [filter, setFilter] = useState<HistoryFilter>(NO_FILTER);
  const [shown, setShown] = useState(HISTORY_PAGE);
  const [open, setOpen] = useState<string | null>(null);

  if (rounds === null) return <div className="lab-hist-pending" aria-hidden="true" />;

  if (rounds.length === 0) {
    return (
      <div className="lab-dash-empty">
        <p className="lab-dash-empty-title">{t("emptyTitle")}</p>
        <p>{t("empty")}</p>
        <Link className="lab-btn lab-btn-primary" href={DASHBOARD_PLAY_HREF}>
          {dashboard("play")}
        </Link>
      </div>
    );
  }

  const matching = filterHistory(rounds, filter);
  const visible = matching.slice(0, shown);
  const changeFilter = (next: HistoryFilter) => {
    setFilter(next);
    setShown(HISTORY_PAGE);
  };

  return (
    <div className="lab-hist">
      <div className="lab-hist-bar">
        <Filters rounds={rounds} filter={filter} onChange={changeFilter} />
        <p className="lab-hist-count" role="status" data-history-count="">
          {t("count", { shown: visible.length, total: matching.length })}
        </p>
      </div>
      {matching.length === 0 ? (
        <div className="lab-dash-empty">
          <p className="lab-dash-empty-title">{t("noMatch")}</p>
          <button type="button" className="lab-btn lab-btn-secondary" onClick={() => changeFilter(NO_FILTER)}>
            {t("clear")}
          </button>
        </div>
      ) : (
        <div className="lab-hist-plate">
          <table className="lab-hist-table">
            <thead>
              <tr>
                {COLUMNS.map((key) => (
                  <th key={key} scope="col" className={key === "board" ? "lab-hist-end" : NUMERIC.includes(key) ? "lab-hist-num" : undefined}>
                    {key === "board" ? <span className="lab-sr">{t(`col.${key}`)}</span> : t(`col.${key}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((round) => (
                <Row key={round.record.id} round={round} open={open === round.record.id} onToggle={() => setOpen(open === round.record.id ? null : round.record.id)} />
              ))}
            </tbody>
          </table>
        </div>
      )}
      {matching.length > shown && (
        <button type="button" className="lab-btn lab-btn-secondary lab-hist-more" onClick={() => setShown(shown + HISTORY_PAGE)}>
          {t("more", { count: Math.min(HISTORY_PAGE, matching.length - shown) })}
        </button>
      )}
      <p className="lab-note lab-hist-note">{t("ratingNote")}</p>
      {total > rounds.length && <p className="lab-note">{t("kept", { kept: rounds.length, total })}</p>}
    </div>
  );
}
