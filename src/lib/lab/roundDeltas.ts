import { BETTER_WHEN, DASHBOARD_GROUPS, dashboardOf, type DashboardInput, type DashboardTile, type Figure, type GameStanding } from "./dashboard";
import { deriveLab } from "./metrics";
import type { RoundRecord } from "./record";
import { removeFromSummary } from "./summary";

/** The dashboard's lead row and totals, in its reading order: the figures one round can move. */
export const DELTA_FIGURES = [...DASHBOARD_GROUPS.lead, ...DASHBOARD_GROUPS.summary] as const;

export type DeltaFigureId = (typeof DELTA_FIGURES)[number];

interface DeltaBase {
  readonly id: DeltaFigureId;
  readonly betterWhen: "higher" | "lower";
  readonly after: Figure;
}

/**
 * One dashboard figure before and after the round. `direction` is the way the number moved; whether that was progress
 * is `verdictOf`. A figure the round first made readable is new and has no before.
 */
export type FigureDelta = DeltaBase &
  (
    | { readonly direction: "new"; readonly before: null; readonly delta: null }
    | { readonly direction: "up" | "down" | "level"; readonly before: Figure; readonly delta: number }
  );

export type Verdict = "better" | "worse" | "level" | "new";

export interface RoundDeltaInput {
  /** What the dashboard reads now, the round included. Its `game` is the standing after the round. */
  readonly dashboard: Omit<DashboardInput, "results">;
  /** The round just played, which `dashboard.records` holds. */
  readonly round: RoundRecord;
  /** The game standing before the round, null when no rated round had been played. */
  readonly gameBefore: GameStanding | null;
}

const figureOf = (tiles: readonly DashboardTile[], id: DeltaFigureId): Figure | null => {
  const tile = tiles.find((candidate) => candidate.id === id);
  return tile && (tile.state === "ready" || tile.state === "stale") ? tile.figure : null;
};

function tilesOf(dashboard: Omit<DashboardInput, "results">): readonly DashboardTile[] {
  const { records, summary, today } = dashboard;
  return dashboardOf({ ...dashboard, results: deriveLab({ records, summary, today }) });
}

function deltaOf(id: DeltaFigureId, before: Figure | null, after: Figure): FigureDelta {
  const betterWhen = BETTER_WHEN[id];
  if (before === null) return { id, betterWhen, direction: "new", before: null, after, delta: null };
  const delta = Number((after.value - before.value).toFixed(after.digits));
  return { id, betterWhen, direction: delta > 0 ? "up" : delta < 0 ? "down" : "level", before, after, delta };
}

/**
 * Every dashboard figure readable after the round, with what it read before it. Both sides go through the dashboard's
 * own tile builders, on the record with and without the round, so the result screen and the dashboard cannot disagree.
 */
export function roundDeltasOf({ dashboard, round, gameBefore }: RoundDeltaInput): readonly FigureDelta[] {
  const records = dashboard.records.filter(({ id }) => id !== round.id);
  const summary = removeFromSummary(dashboard.summary, round, records);
  const after = tilesOf(dashboard);
  const before = tilesOf({ ...dashboard, records, summary, game: gameBefore });
  return DELTA_FIGURES.flatMap((id) => {
    const now = figureOf(after, id);
    return now ? [deltaOf(id, figureOf(before, id), now)] : [];
  });
}

export function verdictOf(delta: FigureDelta): Verdict {
  if (delta.direction === "new" || delta.direction === "level") return delta.direction;
  return (delta.direction === "up") === (delta.betterWhen === "higher") ? "better" : "worse";
}
