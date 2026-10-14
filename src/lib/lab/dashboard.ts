import type { RoundSource } from "@/lib/analytics/events";
import { DEFAULT_PRESET } from "@/lib/game/configPrefill";
import { dailySettingOf } from "@/lib/daily/schedule";
import { playHref } from "@/lib/game/roundLink";
import type { StoredEntries } from "./entries";
import { dailyBoardOf } from "./daily";
import { dayDate, mean, type TrendSetting } from "./engine";
import type { BestEntry, LabResults } from "./metrics";
import { hasFigure, LAB_THRESHOLDS, type Need, type Readiness } from "./readiness";
import { MAX_SOLVE_MS, recentAverage, recentChange } from "./progress";
import { isFreshReading, type RoundRecord } from "./record";
import { byEndedAt } from "./sessions";
import type { LabSummary } from "./summary";
import { weekProgress, type WeekGoal } from "./week";

const DASHBOARD_SOURCE: RoundSource = "dashboard";
export const DASHBOARD_PLAY_HREF = playHref(DEFAULT_PRESET.pieceCount, DEFAULT_PRESET.memorizeTime, DASHBOARD_SOURCE);

export type DashboardUnit = "pieces" | "secondsPerPiece" | "seconds" | "days" | "percent" | "rounds" | "entries" | "rating";

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
  | "plan"
  | "goal"
  | "week"
  | "entry"
  | "overDays"
  | "firstDay"
  | "rating"
  | "ratingSince"
  | "winStreak"
  | "bestAt";

export interface TileContext {
  readonly kind: ContextKind;
  readonly values: Readonly<Record<string, string | number | Date>>;
}

/** Which way a rating moved over the rounds a tile reads, and by how much; the page and the share card both draw it from this. */
export interface Trend {
  readonly direction: "up" | "down" | "level";
  readonly amount: number;
}

/** The setting a warming tile asks for, when its figure reads only one setting. */
export type Rig = Pick<TrendSetting, "pieceCount" | "memorizeSeconds">;

/** Ready and stale draw a figure; warming says what is missing and where to play it, or null when only tomorrow can add it; empty only invites a first round or a choice. */
export type TileState =
  | { readonly state: "ready" | "stale"; readonly figure: Figure; readonly context: TileContext; readonly trend?: Trend }
  | { readonly state: "warming"; readonly need: Need; readonly rig: Rig | null; readonly href: string | null }
  | { readonly state: "empty"; readonly href: string; readonly cta: "play" | "choose" };

/**
 * The page's figure tiles by where they sit: the lead row a player checks first, the totals and records under it,
 * and the figures of the record's other parts at the foot. The charts and tables between them read the metrics whole.
 */
export const DASHBOARD_GROUPS = {
  lead: ["rating", "span", "piecesHeld", "speed", "studyTime", "rebuildTime"],
  summary: ["bestAccuracy", "recentAccuracy", "winStreak", "streak", "rounds", "days"],
  more: ["daily", "week", "curve", "notebook", "plans", "goal", "board"],
} as const;

export const DASHBOARD_TILES = [...DASHBOARD_GROUPS.lead, ...DASHBOARD_GROUPS.summary, ...DASHBOARD_GROUPS.more] as const;

export type DashboardTileId = (typeof DASHBOARD_TILES)[number];
export type DashboardTile = { readonly id: DashboardTileId } & TileState;

/**
 * The figures the share card can carry: the page's lead row and totals, strongest first, so the card and the page never
 * disagree. The times follow the accuracies, so a card never leads with a time, which is better the lower it is.
 */
export const SHARE_TILES = [
  "span",
  "rating",
  "piecesHeld",
  "speed",
  "bestAccuracy",
  "recentAccuracy",
  "studyTime",
  "rebuildTime",
  "winStreak",
  "streak",
  "rounds",
  "days",
] as const satisfies readonly (
  | (typeof DASHBOARD_GROUPS.lead)[number]
  | (typeof DASHBOARD_GROUPS.summary)[number]
)[];

/** Which way of a figure's number is progress. Speed and the two times are seconds, so they improve as they fall. */
export const BETTER_WHEN: { readonly [K in (typeof DASHBOARD_GROUPS.lead)[number] | (typeof DASHBOARD_GROUPS.summary)[number]]: "higher" | "lower" } = {
  rating: "higher",
  span: "higher",
  piecesHeld: "higher",
  speed: "lower",
  studyTime: "lower",
  rebuildTime: "lower",
  bestAccuracy: "higher",
  recentAccuracy: "higher",
  winStreak: "higher",
  streak: "higher",
  rounds: "higher",
  days: "higher",
};

/**
 * What only the game store knows: the skill rating, the run of rounds at WIN_ACCURACY or better, and the rating change
 * of each round it still holds, newest first. Null before the first rated /game round.
 */
export interface GameStanding {
  readonly rating: number;
  readonly winStreak: number;
  readonly changes: readonly number[];
}

export interface DashboardInput {
  readonly results: LabResults;
  readonly summary: LabSummary;
  readonly records: readonly RoundRecord[];
  readonly weekGoal: WeekGoal;
  readonly entries: StoredEntries | null;
  /** The client's local day. */
  readonly today: string;
  /** Today's UTC day and the daily board last opened on this device, which date the daily board. */
  readonly utcDay: string;
  readonly dailyOpened: string | null;
  /** Where a plan or goal is chosen, null where the locale has no lab record to choose it on. */
  readonly chooseHref: string | null;
  readonly game: GameStanding | null;
  /** The accuracy a game round needs to extend the win streak. */
  readonly winAccuracy: number;
}

const rigHref = (rig: Rig | null) => (rig ? playHref(rig.pieceCount, rig.memorizeSeconds, DASHBOARD_SOURCE) : DASHBOARD_PLAY_HREF);

const figure = (value: number, unit: DashboardUnit, digits: 0 | 1 = 0): Figure => ({ value, unit, digits });
const context = (kind: ContextKind, values: TileContext["values"]): TileContext => ({ kind, values });
const tenths = (value: number) => Math.round(value * 10) / 10;
const settingValues = ({ source, pieceCount, memorizeSeconds }: TrendSetting) => ({ source, pieceCount, memorizeSeconds });
/** A game setting only: a link opens the game, so it cannot add a round to a homepage practice setting. */
const gameRig = (setting: TrendSetting | undefined): Rig | null =>
  setting?.source === "game" ? { pieceCount: setting.pieceCount, memorizeSeconds: setting.memorizeSeconds } : null;

const ready = (figureValue: Figure, tileContext: TileContext, trend?: Trend): TileState => ({
  state: "ready",
  figure: figureValue,
  context: tileContext,
  ...(trend && { trend }),
});
const trendOf = (change: number): Trend => ({ direction: change > 0 ? "up" : change < 0 ? "down" : "level", amount: Math.abs(change) });
const emptyPlay = (href = DASHBOARD_PLAY_HREF): TileState => ({ state: "empty", href, cta: "play" });

/** One metric's tile: its figure only once the metric can read one, else what it still needs. */
function fromReadiness(readiness: Readiness, draw: () => Omit<Extract<TileState, { figure: Figure }>, "state"> | null, rig: Rig | null = null): TileState {
  const drawn = hasFigure(readiness) ? draw() : null;
  if (drawn) return { state: readiness.state as "ready" | "stale", ...drawn };
  if (readiness.state === "warming" && readiness.need) return { state: "warming", need: readiness.need, rig, href: readiness.waitsForTomorrow ? null : rigHref(rig) };
  return emptyPlay();
}

/** The highest accuracy among the per-setting bests, the larger board on a tie, then the faster rebuild. */
function topBest(entries: readonly BestEntry[]): BestEntry | null {
  return entries.reduce<BestEntry | null>(
    (top, entry) =>
      top === null ||
      entry.accuracy > top.accuracy ||
      (entry.accuracy === top.accuracy && (entry.pieceCount > top.pieceCount || (entry.pieceCount === top.pieceCount && entry.solveMs < top.solveMs)))
        ? entry
        : top,
    null,
  );
}

const sumOf = (values: readonly number[]) => values.reduce((sum, value) => sum + value, 0);

/**
 * The mean of a time per piece on the board over the newest fresh rounds that measured it, at any setting, from the
 * first such round, with how the last rounds moved against the ones before once there are enough of both. Study time
 * counts what was used, never more than the setting allowed.
 */
function perPieceTile(records: readonly RoundRecord[], msOf: (record: RoundRecord) => number): TileState {
  const perPiece = byEndedAt(records.filter(isFreshReading)).flatMap((record) => {
    const ms = msOf(record);
    return ms > 0 ? [ms / 1000 / record.config.pieceCount] : [];
  });
  if (perPiece.length === 0) return emptyPlay();
  const rounds = Math.min(perPiece.length, LAB_THRESHOLDS.recentRounds);
  const { change } = recentChange(perPiece);
  const trend = change === null ? undefined : trendOf(tenths(change));
  return ready(figure(tenths(recentAverage(perPiece)), "secondsPerPiece", 1), context("recent", { rounds }), trend);
}

/** Null leaves the tile off the page: a figure of nothing found is not progress to show. */
type TileBuilder = (input: DashboardInput) => TileState | null;

const TILES: { readonly [K in DashboardTileId]: TileBuilder } = {
  rating: ({ game }) => {
    if (!game) return emptyPlay();
    const recent = game.changes.slice(0, LAB_THRESHOLDS.recentRounds);
    if (recent.length === 0) return ready(figure(game.rating, "rating"), context("ratingSince", {}));
    const trend = trendOf(sumOf(recent));
    return ready(figure(game.rating, "rating"), context("rating", { sign: trend.direction, change: trend.amount, rounds: recent.length }), trend);
  },
  winStreak: ({ game, winAccuracy }) => (game ? ready(figure(game.winStreak, "rounds"), context("winStreak", { accuracy: winAccuracy })) : emptyPlay()),
  bestAccuracy: ({ results: { bests } }) =>
    fromReadiness(bests.readiness, () => {
      const top = bests.value && topBest(bests.value.entries);
      return top
        ? { figure: figure(Math.round(top.accuracy), "percent"), context: context("bestAt", { source: top.source, pieceCount: top.pieceCount, memorizeSeconds: top.memorizeSeconds }) }
        : null;
    }),
  recentAccuracy: ({ records }) => {
    const recent = byEndedAt(records.filter(isFreshReading)).slice(-LAB_THRESHOLDS.recentRounds);
    if (recent.length === 0) return emptyPlay();
    return ready(figure(Math.round(mean(recent.map(({ accuracy }) => accuracy))), "percent"), context("recent", { rounds: recent.length }));
  },
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
        figure: figure(tenths(piecesHeld.value.average), "pieces", 1),
        context: context("recent", { rounds: Math.min(LAB_THRESHOLDS.recentRounds, piecesHeld.readiness.sampleSize) }),
      },
    ),
  speed: ({ results: { speed } }) =>
    fromReadiness(
      speed.readiness,
      () =>
        speed.value && {
          figure: figure(tenths(speed.value.average), "secondsPerPiece", 1),
          context: context("setting", { ...settingValues(speed.value.setting), rounds: Math.min(LAB_THRESHOLDS.recentRounds, speed.readiness.sampleSize) }),
        },
      gameRig(speed.value?.setting),
    ),
  studyTime: ({ records }) => perPieceTile(records, ({ memorizeMs, config }) => Math.min(memorizeMs, config.memorizeSeconds * 1000)),
  rebuildTime: ({ records }) => perPieceTile(records, ({ solveMs }) => Math.min(solveMs, MAX_SOLVE_MS)),
  streak: ({ results: { streak } }) =>
    fromReadiness(streak.readiness, () => streak.value && { figure: figure(streak.value.current, "days"), context: context("longest", { days: streak.value.longest }) }),
  rounds: ({ summary }) => (summary.rounds === 0 ? emptyPlay() : ready(figure(summary.rounds, "rounds"), context("overDays", { days: summary.days.length }))),
  days: ({ summary }) => {
    const first = summary.days[0];
    return first === undefined ? emptyPlay() : ready(figure(summary.days.length, "days"), context("firstDay", { date: dayDate(first) }));
  },
  daily: ({ records, utcDay, dailyOpened }) => {
    const board = dailyBoardOf(records, utcDay, dailyOpened);
    if (!board.streak) {
      const { pieceCount, memorizeTime } = dailySettingOf(utcDay);
      return emptyPlay(playHref(pieceCount, memorizeTime, "daily"));
    }
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
  return DASHBOARD_TILES.flatMap((id) => {
    const state = TILES[id](input);
    return state ? [{ id, ...state }] : [];
  });
}

export type ShareFigureId = (typeof SHARE_TILES)[number];

export interface ShareFigure {
  readonly id: ShareFigureId;
  readonly figure: Figure;
  readonly context: TileContext;
  readonly trend?: Trend;
}

/**
 * The figures the share card prints: ready ones only, since a stale or warming figure would pass for current. The
 * first is drawn large: the strongest figure above zero, so a card never leads with a streak of nothing.
 */
export interface ShareCard {
  readonly figures: readonly ShareFigure[];
  readonly rounds: number;
}

export function shareCardOf(tiles: readonly DashboardTile[], rounds: number): ShareCard | null {
  const figures = SHARE_TILES.flatMap((id): ShareFigure[] => {
    const tile = tiles.find((candidate) => candidate.id === id);
    // Only the rating's trend travels: a share link carries no other, so the card and its link preview agree.
    if (tile?.state !== "ready") return [];
    const trend = id === "rating" ? tile.trend : undefined;
    return [{ id, figure: tile.figure, context: tile.context, ...(trend && { trend }) }];
  });
  const lead = figures.find(({ figure }) => figure.value > 0);
  if (!lead) return null;
  return { figures: [lead, ...figures.filter((candidate) => candidate !== lead)], rounds };
}
