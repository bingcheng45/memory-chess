"use client";

import { Fragment, useId, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { LabPanel } from "@/lib/analytics/events";
import type { BestEntry, LabResults, MissCell, TypeRecall } from "@/lib/lab/metrics";
import { figureNumber, type PanelId } from "@/lib/lab/panels";
import type { StreakDay } from "@/lib/lab/streak";
import { hasFigure, type Readiness, type ReadinessState } from "@/lib/lab/readiness";
import type { PieceSymbol } from "chess.js";
import { FILES, RANKS } from "@/lib/game/board";
import { mapChessJsPieceToType } from "@/utils/chessPieces";
import { formatSeconds } from "@/utils/timer";
import { seconds, settingValues } from "./labFormat";
import { AccuracySparkline, MissLines, MissMap, RecallBar, StreakGrid } from "./LabCharts";
import { LabPlayLink } from "./LabPlayLink";
import { LabWeek, SampleWeek } from "./LabWeek";
import { LAB_SECTIONS } from "./SectionHeading";

const missShare = ({ shown, missed, ready }: MissCell) => (ready ? missed / shown : null);

export const figureOf = (panel: PanelId) => figureNumber(LAB_SECTIONS.record.number, panel);

export function PanelHead({ fig, tag }: { fig: string; tag: ReactNode }) {
  return (
    <div className="lab-panel-h">
      <span className="lab-k">{fig}</span>
      <span className="lab-tag-slot">{tag}</span>
    </div>
  );
}

interface FrameProps {
  readonly panel: PanelId;
  /** The panel's class suffix and its messages under home.lab.record. */
  readonly name: "span" | "held" | "speed" | "spark" | "heat" | "streak" | "bests" | "types" | "insights" | "notebook";
  readonly tag: ReactNode;
  readonly state: ReadinessState;
  readonly title?: string;
  /** Text above the body that reads the same in every state. */
  readonly intro?: ReactNode;
  readonly children: ReactNode;
}

export function PanelFrame({ panel, name, tag, state, title, intro, children }: FrameProps) {
  const t = useTranslations("home.lab.record");
  return (
    <div className={`lab-panel lab-p-${name}`}>
      <PanelHead fig={t(`${name}.fig`, { number: figureOf(panel) })} tag={tag} />
      <h3>{title ?? t(`${name}.title`)}</h3>
      {intro}
      {/* Keyed by state, so new content mounts fresh instead of moving the nodes it replaces. */}
      <Fragment key={state}>{children}</Fragment>
    </div>
  );
}

/** The figure stays; the note only says how long ago the last round was. `daysAgo` is null on the server. */
export function StaleNote({ readiness, daysAgo, panel }: { readiness: Readiness; daysAgo: number | null; panel: LabPanel }) {
  const t = useTranslations("home.lab.record");
  if (readiness.state !== "stale" || daysAgo === null) return null;
  return (
    <p className="lab-note lab-stale">
      {t("stale", { count: daysAgo })} <LabPlayLink panel={panel} />
    </p>
  );
}

export function useTags() {
  const tags = useTranslations("home.lab.tags");
  const t = useTranslations("home.lab.record");
  // Keyed apart so the swap mounts a new tag; reusing one moved its centred text sideways, a layout shift.
  return {
    sample: <span key="sample" className="lab-tag lab-tag-blue">{tags("sample")}</span>,
    mine: <span key="mine" className="lab-tag lab-tag-mint">{t("mine")}</span>,
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
  const bySession = trend?.granularity === "session" && hasFigure(readiness);
  const points = trend ? (bySession ? trend.bySession.map(Math.round) : trend.points) : [];

  return (
    <PanelFrame
      panel="trend"
      name="spark"
      tag={played ? tags.mine : tags.sample}
      state={readiness.state}
      title={bySession ? t("spark.titleSessions") : t("spark.title")}
    >
      {!trend ? (
        <>
          <AccuracySparkline label={t("spark.aria")} first={t("spark.first")} last={t("spark.last")} />
          <p className="lab-note">{t("spark.note")}</p>
        </>
      ) : hasFigure(readiness) ? (
        <>
          <AccuracySparkline
            points={points}
            label={t(bySession ? "spark.realAriaSessions" : "spark.realAria", { count: points.length, latest: points[points.length - 1], ...trend.setting })}
            first={t("spark.realFirst")}
            last={t("spark.realLast")}
          />
          <p className="lab-note">
            {t("spark.config", settingValues(trend.setting))} · {t("fromRounds", { count: readiness.sampleSize })}
            {bySession && ` · ${t("spark.sessions", { count: points.length })}`}
          </p>
          <StaleNote readiness={readiness} daysAgo={daysAgo} panel="trend" />
        </>
      ) : (
        <p className="lab-panel-desc lab-empty">
          {need.rounds === undefined
            ? t("spark.needDay", settingValues(trend.setting))
            : t(need.days ? "spark.needRoundsAndDay" : "spark.needRounds", { count: need.rounds, ...settingValues(trend.setting) })}
        </p>
      )}
    </PanelFrame>
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
    <PanelFrame panel="missMap" name="heat" tag={map ? tags.mine : tags.sample} state={readiness.state}>
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
            <div className="lab-heat-pair">
              <MissLines caption={t("heat.files")} lines={lines(map.files, FILES)} />
              <MissLines caption={t("heat.ranks")} lines={lines(map.ranks, RANKS)} />
            </div>
          )}
          <p className="lab-note">
            {t("heat.realNote")} {t("fromRounds", { count: readiness.sampleSize })}
          </p>
          <StaleNote readiness={readiness} daysAgo={daysAgo} panel="missMap" />
        </>
      )}
    </PanelFrame>
  );
}

const STREAK_KEY = ["played", "forgiven", "missed", "today"] as const;

/** Words beside each square style, so a forgiven day never reads by colour or pattern alone. */
function StreakKey() {
  const t = useTranslations("home.lab.record.streak.key");
  return (
    <p className="lab-note lab-streak-key">
      {STREAK_KEY.map((day) => (
        <span key={day}>
          <i data-day={day} aria-hidden="true" /> {t(day)}
        </span>
      ))}
    </p>
  );
}

interface StreakPanelProps {
  readonly result: LabResults["streak"];
  readonly days: readonly string[];
  readonly today: string;
  readonly daysAgo: number | null;
}

export function StreakPanel({ result: { readiness, value: streak }, days, today, daysAgo }: StreakPanelProps) {
  const t = useTranslations("home.lab.record");
  const tags = useTags();
  const count = (day: StreakDay) => streak?.window.filter((shown) => shown === day).length ?? 0;
  const note = streak && [
    t("streak.realNote", { current: streak.current, longest: streak.longest }),
    ...(streak.graceUsed ? [t("streak.forgiven", { count: streak.forgivenDays.length })] : []),
    t("fromRounds", { count: readiness.sampleSize }),
  ];

  return (
    <PanelFrame
      panel="streak"
      name="streak"
      tag={streak ? tags.mine : tags.sample}
      state={readiness.state}
      intro={<p className="lab-panel-desc">{streak ? t("streak.realDesc") : t("streak.desc")}</p>}
    >
      {!streak ? (
        <>
          <StreakGrid label={t("streak.aria")} />
          <StreakKey />
          <p className="lab-note">{t("streak.note")}</p>
          <SampleWeek />
        </>
      ) : (
        <>
          <StreakGrid days={streak.window} label={t("streak.realAria", { count: count("played"), forgiven: count("forgiven") })} />
          <StreakKey />
          <p className="lab-note">{hasFigure(readiness) ? note?.join(" · ") : t("streak.need", { days: readiness.need?.days ?? 0 })}</p>
          {today && <LabWeek days={days} today={today} />}
          <StaleNote readiness={readiness} daysAgo={daysAgo} panel="streak" />
        </>
      )}
    </PanelFrame>
  );
}

/** Six rows on wider screens and two on phones keep the panel one reserved height for any number of settings played. */
const BESTS_SHOWN = 6;
const BESTS_SHOWN_NARROW = 2;

type HiddenFrom = "wide" | "narrow";

/** Rows past the latest six are hidden everywhere until expanded, rows past the latest two on phones (lab-instruments.css). */
function olderThanShown(entries: readonly BestEntry[]): Map<string, HiddenFrom> {
  const latestFirst = [...entries].sort((a, b) => b.at - a.at);
  return new Map(
    latestFirst.slice(BESTS_SHOWN_NARROW).map(({ key }, index): [string, HiddenFrom] => [key, index + BESTS_SHOWN_NARROW >= BESTS_SHOWN ? "wide" : "narrow"]),
  );
}

export function BestsPanel({ result: { readiness, value: bests }, daysAgo }: { result: LabResults["bests"]; daysAgo: number | null }) {
  const t = useTranslations("home.lab.record");
  const tags = useTags();
  const listId = useId();
  const [expanded, setExpanded] = useState(false);
  const older = bests && !expanded ? olderThanShown(bests.entries) : null;
  const count = bests?.entries.length ?? 0;

  return (
    <PanelFrame
      panel="bests"
      name="bests"
      tag={bests ? tags.mine : null}
      state={readiness.state}
      intro={<p className="lab-panel-desc">{t("bests.desc")}</p>}
    >
      {bests ? (
        <>
          <dl className="lab-bests" id={listId}>
            {bests.entries.map((best) => (
              <div key={best.key} data-older={older?.get(best.key)}>
                <dt>{t("bests.setting", settingValues(best))}</dt>
                <dd>
                  {t("bests.reading", { accuracy: best.accuracy, time: seconds(formatSeconds(best.solveMs)) })}
                  {best.rounds === 1 && <span className="lab-note"> · {t("bests.first")}</span>}
                </dd>
              </div>
            ))}
          </dl>
          {count > BESTS_SHOWN_NARROW && (
            <button
              type="button"
              className="lab-bests-toggle"
              aria-expanded={expanded}
              aria-controls={listId}
              data-shown={count > BESTS_SHOWN ? undefined : "narrow"}
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? t("bests.showFewer") : t("bests.showAll", { count })}
            </button>
          )}
          <p className="lab-note">{t("fromRounds", { count: readiness.sampleSize })}</p>
          <StaleNote readiness={readiness} daysAgo={daysAgo} panel="bests" />
        </>
      ) : (
        <p className="lab-panel-desc lab-empty">{t("bests.empty")}</p>
      )}
    </PanelFrame>
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
    <PanelFrame panel="typeRecall" name="types" tag={ready ? tags.mine : null} state={readiness.state}>
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
    </PanelFrame>
  );
}
