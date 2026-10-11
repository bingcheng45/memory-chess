import type { PieceSymbol } from "chess.js";
import type { RoundSource } from "@/lib/analytics/events";
import { DEFAULT_PRESET } from "@/lib/game/configPrefill";
import { FILES, RANKS } from "@/lib/game/board";
import { playHref } from "@/lib/game/roundLink";
import type { StoredEntries } from "./entries";
import { dailyBoardOf, DAILY_SETTING } from "./daily";
import { dayDate, mean, type TrendSetting } from "./engine";
import type { LabResults, MissCell } from "./metrics";
import { hasFigure, LAB_THRESHOLDS, type Need, type Readiness } from "./readiness";
import type { LabSummary } from "./summary";
import { weekProgress, type WeekGoal } from "./week";

const DASHBOARD_SOURCE: RoundSource = "dashboard";
export const DASHBOARD_PLAY_HREF = playHref(DEFAULT_PRESET.pieceCount, DEFAULT_PRESET.memorizeTime, DASHBOARD_SOURCE);
const DAILY_PLAY = playHref(DAILY_SETTING.pieceCount, DAILY_SETTING.memorizeTime, "daily");

export type DashboardUnit = "pieces" | "secondsPerPiece" | "days" | "percent" | "rounds" | "entries" | "findings" | "settings";

export interface Figure {
  readonly value: number;
  readonly unit: DashboardUnit;
  readonly digits: 0 | 1;
}

/** Each kind is one message under dashboard.context, and `values` are its arguments. */
type ContextKind =
  | "span"
  | "recent"
  | "setting"
  | "longest"
  | "daily"
  | "curve"
  | "rounds"
  | "missLine"
  | "pieceType"
  | "plan"
  | "goal"
  | "week"
  | "best"
  | "entry"
  | "overDays"
  | "firstDay";

export interface TileContext {
  readonly kind: ContextKind;
  readonly values: Readonly<Record<string, string | number | Date>>;
}

/** The setting a warming tile asks for, when its figure reads only one setting. */
export type Rig = Pick<TrendSetting, "pieceCount" | "memorizeSeconds">;

/** Ready and stale draw a figure; warming says what is missing and where to play it; empty only invites a first round or a choice. */
export type TileState =
  | { readonly state: "ready" | "stale"; readonly figure: Figure; readonly context: TileContext }
  | { readonly state: "warming"; readonly need: Need; readonly rig: Rig | null; readonly href: string }
  | { readonly state: "empty"; readonly href: string; readonly cta: "play" | "choose" };

export const DASHBOARD_TILES = [
  "span",
  "piecesHeld",
  "speed",
  "streak",
  "rounds",
  "days",
  "trend",
  "daily",
  "week",
  "curve",
  "missMap",
  "typeRecall",
  "insights",
  "notebook",
  "plans",
  "goal",
  "bests",
  "board",
] as const;

export type DashboardTileId = (typeof DASHBOARD_TILES)[number];
export type DashboardTile = { readonly id: DashboardTileId } & TileState;

/** The headline row: the four figures a player checks first, and the ones the share card carries. */
export const HEADLINE_TILES = ["span", "piecesHeld", "speed", "streak"] as const satisfies readonly DashboardTileId[];

export interface DashboardInput {
  readonly results: LabResults;
  readonly summary: LabSummary;
  readonly records: Parameters<typeof dailyBoardOf>[0];
  readonly weekGoal: WeekGoal;
  readonly entries: StoredEntries | null;
  /** The client's local day. */
  readonly today: string;
  /** Today's UTC day and the daily board last opened on this device, which date the daily board. */
  readonly utcDay: string;
  readonly dailyOpened: string | null;
  /** Where a plan or goal is chosen, null where the locale has no lab record to choose it on. */
  readonly chooseHref: string | null;
}

const rigHref = (rig: Rig | null) => (rig ? playHref(rig.pieceCount, rig.memorizeSeconds, DASHBOARD_SOURCE) : DASHBOARD_PLAY_HREF);

const figure = (value: number, unit: DashboardUnit, digits: 0 | 1 = 0): Figure => ({ value, unit, digits });
const context = (kind: ContextKind, values: TileContext["values"]): TileContext => ({ kind, values });
const tenths = (value: number) => Math.round(value * 10) / 10;
const settingValues = ({ source, pieceCount, memorizeSeconds }: TrendSetting) => ({ source, pieceCount, memorizeSeconds });
/** A game setting only: a link opens the game, so it cannot add a round to a homepage practice setting. */
const gameRig = (setting: TrendSetting | undefined): Rig | null =>
  setting?.source === "game" ? { pieceCount: setting.pieceCount, memorizeSeconds: setting.memorizeSeconds } : null;

const ready = (figureValue: Figure, tileContext: TileContext): TileState => ({ state: "ready", figure: figureValue, context: tileContext });
const emptyPlay = (href = DASHBOARD_PLAY_HREF): TileState => ({ state: "empty", href, cta: "play" });

/** One metric's tile: its figure only once the metric can read one, else what it still needs. */
function fromReadiness(readiness: Readiness, draw: () => Omit<Extract<TileState, { figure: Figure }>, "state"> | null, rig: Rig | null = null): TileState {
  const drawn = hasFigure(readiness) ? draw() : null;
  if (drawn) return { state: readiness.state as "ready" | "stale", ...drawn };
  if (readiness.state === "warming" && readiness.need) return { state: "warming", need: readiness.need, rig, href: rigHref(rig) };
  return emptyPlay();
}

const missShare = ({ shown, missed }: MissCell) => missed / shown;

/** The most missed file or rank among those with enough pieces seen to read. */
function weakestLine(files: readonly MissCell[], ranks: readonly MissCell[]) {
  const lines = [
    ...files.map((cell, index) => ({ cell, line: "file", name: FILES[index] as string })),
    ...ranks.map((cell, index) => ({ cell, line: "rank", name: RANKS[index] as string })),
  ].filter(({ cell }) => cell.ready);
  return lines.reduce<(typeof lines)[number] | null>((worst, line) => (worst === null || missShare(line.cell) > missShare(worst.cell) ? line : worst), null);
}

type TileBuilder = (input: DashboardInput) => TileState;

const TILES: { readonly [K in DashboardTileId]: TileBuilder } = {
  span: ({ results: { span } }) =>
    fromReadiness(span.readiness, () =>
      span.value?.pieceCount == null || span.value.memorizeSeconds === null
        ? null
        : {
            figure: figure(span.value.pieceCount, "pieces"),
            context: context("span", { rounds: span.value.qualifyingRounds, accuracy: LAB_THRESHOLDS.spanAccuracy, memorizeSeconds: span.value.memorizeSeconds }),
          },
    ),
  piecesHeld: ({ results: { piecesHeld } }) =>
    fromReadiness(piecesHeld.readiness, () =>
      piecesHeld.value && {
        figure: figure(tenths(piecesHeld.value.recent.average), "pieces", 1),
        context: context("recent", { rounds: Math.min(LAB_THRESHOLDS.rollingWindow, piecesHeld.readiness.sampleSize) }),
      },
    ),
  speed: ({ results: { speed } }) =>
    fromReadiness(
      speed.readiness,
      () =>
        speed.value && {
          figure: figure(tenths(speed.value.recent.average), "secondsPerPiece", 1),
          context: context("setting", { ...settingValues(speed.value.setting), rounds: speed.readiness.sampleSize }),
        },
      gameRig(speed.value?.setting),
    ),
  streak: ({ results: { streak } }) =>
    fromReadiness(streak.readiness, () => streak.value && { figure: figure(streak.value.current, "days"), context: context("longest", { days: streak.value.longest }) }),
  rounds: ({ summary }) => (summary.rounds === 0 ? emptyPlay() : ready(figure(summary.rounds, "rounds"), context("overDays", { days: summary.days.length }))),
  days: ({ summary }) => {
    const first = summary.days[0];
    return first === undefined ? emptyPlay() : ready(figure(summary.days.length, "days"), context("firstDay", { date: dayDate(first) }));
  },
  trend: ({ results: { trend } }) =>
    fromReadiness(
      trend.readiness,
      () =>
        trend.value && {
          figure: figure(Math.round(mean(trend.value.points.slice(-LAB_THRESHOLDS.rollingWindow))), "percent"),
          context: context("setting", { ...settingValues(trend.value.setting), rounds: trend.readiness.sampleSize }),
        },
      gameRig(trend.value?.setting),
    ),
  daily: ({ records, utcDay, dailyOpened }) => {
    const board = dailyBoardOf(records, utcDay, dailyOpened);
    if (!board.streak) return emptyPlay(DAILY_PLAY);
    return ready(figure(board.streak.current, "days"), context("daily", { status: board.status, longest: board.streak.longest }));
  },
  week: ({ summary, today, weekGoal }) => {
    if (summary.rounds === 0) return emptyPlay();
    const week = weekProgress(summary.days, today, weekGoal);
    return ready(figure(week.daysPlayed, "days"), context("week", { goal: week.goal }));
  },
  curve: ({ results: { curve } }) =>
    fromReadiness(curve.readiness, () => {
      const latest = curve.value?.points.filter(({ day }) => day > 0).at(-1);
      return latest ? { figure: figure(latest.accuracy, "percent"), context: context("curve", { day: latest.day, reviews: latest.count }) } : null;
    }),
  missMap: ({ results: { missMap } }) =>
    fromReadiness(missMap.readiness, () => {
      const worst = missMap.value && weakestLine(missMap.value.files, missMap.value.ranks);
      return worst
        ? { figure: figure(Math.round(missShare(worst.cell) * 100), "percent"), context: context("missLine", { line: worst.line, name: worst.name, shown: worst.cell.shown }) }
        : null;
    }),
  typeRecall: ({ results: { typeRecall } }) =>
    fromReadiness(typeRecall.readiness, () => {
      const weakest = typeRecall.value?.types
        .filter(({ ready: counted }) => counted)
        .reduce<{ type: PieceSymbol; share: number; shown: number } | null>((low, { type, shown, recalled }) => {
          const share = recalled / shown;
          return low === null || share < low.share ? { type, share, shown } : low;
        }, null);
      return weakest ? { figure: figure(Math.round(weakest.share * 100), "percent"), context: context("pieceType", { type: weakest.type, shown: weakest.shown }) } : null;
    }),
  insights: ({ results: { insights }, summary }) =>
    fromReadiness(insights.readiness, () => insights.value && { figure: figure(insights.value.insights.length, "findings"), context: context("rounds", { rounds: summary.rounds }) }),
  notebook: ({ results: { notebook }, summary }) =>
    fromReadiness(notebook.readiness, () => notebook.value && { figure: figure(notebook.value.entries.length, "entries"), context: context("rounds", { rounds: summary.rounds }) }),
  plans: ({ results: { plans }, chooseHref }) => {
    if (!plans.value) return chooseHref ? { state: "empty", href: chooseHref, cta: "choose" } : emptyPlay();
    const { planId, status } = plans.value;
    return { state: plans.readiness.state === "stale" ? "stale" : "ready", figure: figure(status.day, "days"), context: context("plan", { planId, status: status.kind }) };
  },
  goal: ({ results: { goal }, chooseHref }) => {
    if (!goal.value) return chooseHref ? { state: "empty", href: chooseHref, cta: "choose" } : emptyPlay();
    const { target, percent } = goal.value;
    return fromReadiness(
      goal.readiness,
      () => ({ figure: figure(percent, "percent"), context: context("goal", { pieceCount: target.pieceCount, accuracy: target.accuracy }) }),
      { pieceCount: target.pieceCount, memorizeSeconds: DEFAULT_PRESET.memorizeTime },
    );
  },
  bests: ({ results: { bests } }) =>
    fromReadiness(bests.readiness, () => {
      const entries = bests.value?.entries ?? [];
      const top = entries.reduce<(typeof entries)[number] | null>(
        (best, entry) => (best === null || entry.pieceCount > best.pieceCount || (entry.pieceCount === best.pieceCount && entry.accuracy > best.accuracy) ? entry : best),
        null,
      );
      return top
        ? {
            figure: figure(entries.length, "settings"),
            context: context("best", { accuracy: Math.round(top.accuracy), pieceCount: top.pieceCount, memorizeSeconds: top.memorizeSeconds }),
          }
        : null;
    }),
  board: ({ entries }) => {
    const best = Object.values(entries ?? {}).reduce<{ difficulty: string; correct: number } | null>(
      (top, entry) => (entry && (top === null || entry.score.correctPieces > top.correct) ? { difficulty: entry.difficulty, correct: entry.score.correctPieces } : top),
      null,
    );
    return best ? ready(figure(best.correct, "pieces"), context("entry", { difficulty: best.difficulty })) : emptyPlay();
  },
};

/** Every tracked figure on this device, one tile each, in the page's reading order. Pure, so the page memoises it. */
export function dashboardOf(input: DashboardInput): readonly DashboardTile[] {
  return DASHBOARD_TILES.map((id) => ({ id, ...TILES[id](input) }));
}

export type ShareFigureId = (typeof HEADLINE_TILES)[number];

/** The figures the share card prints: ready ones only, since a stale or warming figure would pass for current. */
export interface ShareCard {
  readonly figures: readonly { readonly id: ShareFigureId; readonly figure: Figure }[];
  readonly rounds: number;
}

export function shareCardOf(tiles: readonly DashboardTile[], rounds: number): ShareCard | null {
  const figures = HEADLINE_TILES.flatMap((id) => {
    const tile = tiles.find((candidate) => candidate.id === id);
    return tile?.state === "ready" && tile.figure.value > 0 ? [{ id, figure: tile.figure }] : [];
  });
  return figures.length === 0 ? null : { figures, rounds };
}
