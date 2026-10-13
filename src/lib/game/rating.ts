/**
 * The skill rating: a placement estimate over the first rated rounds, then an Elo-style gain or loss against the
 * board's level, scaled by how far the board sits from the player's own recent boards and, on a gain, by speed.
 * Pure and store-free, so the store, the tests and scripts/rating/simulate.mjs all run the same engine.
 */

export const START_RATING = 1000;

export const MAX_SKILL_RATING = 5000;

/** The accuracy a rated round needs to count as a win: it extends the win streak, and it is an even result. */
export const WIN_ACCURACY = 70;

/** Rated rounds that estimate the first rating. */
export const PLACEMENT_ROUNDS = 10;

/** Rated rounds the player's norm is read from, and so the rated rounds the history keeps. */
export const NORM_ROUNDS = 30;

export const isSkillRating = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0;

/** What the rating reads from a rated round. */
export interface RatedRoundFacts {
  readonly pieceCount: number;
  /** The study time used, not the time allowed. */
  readonly studySeconds: number;
  readonly rebuildSeconds: number;
  /** 0 to 100. */
  readonly accuracy: number;
}

/** The player's last rated rounds summed up: the boards they usually take and how fast they usually are. */
export interface PlayerNorm {
  readonly rounds: number;
  readonly meanLevel: number;
  readonly levelSpread: number;
  /** Means of log2 seconds per piece. */
  readonly studyPace: number;
  readonly rebuildPace: number;
}

export type RiskDirection = "harder" | "normal" | "easier";

export interface PlacementBreakdown {
  /** 1-based: this round's place among the placement rounds. */
  readonly round: number;
  readonly of: number;
  readonly boardLevel: number;
  /** How much of the board's difficulty the accuracy earned, 0 to 1. */
  readonly gate: number;
  /** The rating this round alone suggests. */
  readonly performance: number;
}

export interface RatedBreakdown {
  readonly boardLevel: number;
  readonly expected: number;
  readonly outcome: number;
  /** K × (outcome − expected), before the multipliers. */
  readonly base: number;
  readonly risk: { readonly direction: RiskDirection; readonly sigmas: number; readonly multiplier: number };
  /** Applied to a gain only. */
  readonly speed: number;
}

export type RatingResult =
  | { readonly phase: "placement"; readonly rating: number; readonly change: number; readonly breakdown: PlacementBreakdown }
  | { readonly phase: "rated"; readonly rating: number; readonly change: number; readonly breakdown: RatedBreakdown };

/** Medium, 6 pieces studied for 10 seconds, is a board of level START_RATING. */
const REFERENCE_PIECES = 6;
const REFERENCE_STUDY_SECONDS = 10;
/** Level per doubling of the pieces at the same study time per piece. */
const PIECE_WEIGHT = 400;
/** Level per halving of the study time at the same piece count. */
const STUDY_WEIGHT = 150;
/** Study time is counted between these, so pressing Done at once cannot make a board look endlessly hard. */
const STUDY_SECONDS_RANGE = { min: 1, max: 60 } as const;

/** Placement's third, smallest weight: level per halving of rebuild seconds per piece, at most one halving either way. */
const REBUILD_WEIGHT = 60;
const REFERENCE_REBUILD_PER_PIECE = 2.5;

/** At or under this accuracy a round is a full loss and earns no credit for its board. */
const FLOOR_ACCURACY = 40;
/** The widest a single round's performance sits from its board, as in Elo's performance rating. */
const PERFORMANCE_SPREAD = 400;

const K = 32;
const ELO_SCALE = 400;
/** A board this far or more above the rating counts as only this far above: a gain stays bounded and a miss still costs. */
const HARDER_GAP_CAP = 400;
/** A board this far or more below the rating has nothing left to prove: clearing it earns nothing. */
const NO_GAIN_GAP = 500;
const MAX_RATED_CHANGE = 50;

/** ±5% of the player's usual effective piece count is their normal range. */
const NORMAL_BAND = (PIECE_WEIGHT + STUDY_WEIGHT) * Math.log2(1.05);
/** A player who always takes one board still has a spread, so a modest change is not read as extreme. */
const SPREAD_FLOOR = (PIECE_WEIGHT + STUDY_WEIGHT) * Math.log2(1.25);
const RISK_AMPLIFY = 0.5;
const RISK_SOFTEN = 0.5;
/** The most the speed variance moves a gain, either way. */
const SPEED_SWING = 0.15;

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const studied = (seconds: number): number => clamp(seconds, STUDY_SECONDS_RANGE.min, STUDY_SECONDS_RANGE.max);

/**
 * The board on the rating scale. Pieces weigh most: doubling them at the same study time per piece adds PIECE_WEIGHT,
 * and doubling them in the same study time adds that plus STUDY_WEIGHT. Rebuild speed is performance, not difficulty.
 */
export function boardLevel({ pieceCount, studySeconds }: Pick<RatedRoundFacts, "pieceCount" | "studySeconds">): number {
  return (
    START_RATING +
    (PIECE_WEIGHT + STUDY_WEIGHT) * Math.log2(pieceCount / REFERENCE_PIECES) +
    STUDY_WEIGHT * Math.log2(REFERENCE_STUDY_SECONDS / studied(studySeconds))
  );
}

/** Elo's score: 0 at FLOOR_ACCURACY or under, 1 at 100%, and an even 0.5 at WIN_ACCURACY. */
export function outcomeOf(accuracy: number): number {
  return clamp((accuracy - FLOOR_ACCURACY) / (100 - FLOOR_ACCURACY), 0, 1);
}

/** How much credit for a board's difficulty the accuracy earns: none at FLOOR_ACCURACY or under, all of it from a win. */
function gateOf(accuracy: number): number {
  return clamp((accuracy - FLOOR_ACCURACY) / (WIN_ACCURACY - FLOOR_ACCURACY), 0, 1);
}

const pace = (seconds: number, pieceCount: number): number => Math.log2(Math.max(seconds, 0.1) / pieceCount);

function rebuildCredit({ pieceCount, rebuildSeconds }: RatedRoundFacts): number {
  return REBUILD_WEIGHT * clamp(Math.log2(REFERENCE_REBUILD_PER_PIECE) - pace(rebuildSeconds, pieceCount), -1, 1);
}

/**
 * The rating one placement round suggests: its board, plus a little for a fast rebuild, both earned only as far as
 * the accuracy allows, then up to PERFORMANCE_SPREAD either way for the result. A board easier than the start keeps
 * its low level when failed; one harder than the start is worth no more than the start when the board is near empty.
 */
function performanceOf(round: RatedRoundFacts): { readonly level: number; readonly gate: number; readonly performance: number } {
  const level = boardLevel(round);
  const gate = gateOf(round.accuracy);
  const earned = Math.min(level, START_RATING + (level - START_RATING) * gate) + gate * rebuildCredit(round);
  const outcome = clamp(outcomeOf(round.accuracy), 0.01, 0.99);
  const result = clamp(ELO_SCALE * Math.log10(outcome / (1 - outcome)), -PERFORMANCE_SPREAD, PERFORMANCE_SPREAD);
  return { level, gate, performance: earned + result };
}

const mean = (values: readonly number[]): number => values.reduce((sum, value) => sum + value, 0) / values.length;

/** Null with no rounds. */
export function normOf(history: readonly RatedRoundFacts[]): PlayerNorm | null {
  const rounds = history.slice(0, NORM_ROUNDS);
  if (rounds.length === 0) return null;
  const levels = rounds.map(boardLevel);
  const meanLevel = mean(levels);
  return {
    rounds: rounds.length,
    meanLevel,
    levelSpread: Math.sqrt(mean(levels.map((level) => (level - meanLevel) ** 2))),
    studyPace: mean(rounds.map(({ studySeconds, pieceCount }) => pace(studied(studySeconds), pieceCount))),
    rebuildPace: mean(rounds.map(({ rebuildSeconds, pieceCount }) => pace(rebuildSeconds, pieceCount))),
  };
}

/** erf by Abramowitz and Stegun 7.1.26, within 1.5e-7. */
function erf(x: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const poly = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  return Math.sign(x) * (1 - poly * Math.exp(-x * x));
}

/**
 * How unusual the board is for this player, read as a normal distribution of their own recent boards: the distance
 * beyond the normal band in standard deviations, and 2Φ(z) − 1, which is 0 at the band's edge and nears 1 far out.
 */
function riskOf(level: number, norm: PlayerNorm): { readonly direction: RiskDirection; readonly sigmas: number; readonly weight: number } {
  const deviation = level - norm.meanLevel;
  const beyond = Math.abs(deviation) - NORMAL_BAND;
  if (beyond <= 0) return { direction: "normal", sigmas: 0, weight: 0 };
  const sigmas = beyond / Math.max(norm.levelSpread, SPREAD_FLOOR);
  return { direction: deviation > 0 ? "harder" : "easier", sigmas, weight: erf(sigmas / Math.SQRT2) };
}

/** A harder board amplifies a gain and softens a loss; an easier one does the reverse. */
function riskMultiplier(direction: RiskDirection, weight: number, gained: boolean): number {
  if (direction === "normal") return 1;
  const rewarded = (direction === "harder") === gained;
  return rewarded ? 1 + RISK_AMPLIFY * weight : 1 - RISK_SOFTEN * weight;
}

/** Up to SPEED_SWING either way, half from study pace and half from rebuild pace against the player's own. */
function speedOf(round: RatedRoundFacts, norm: PlayerNorm): number {
  const study = clamp(norm.studyPace - pace(studied(round.studySeconds), round.pieceCount), -1, 1);
  const rebuild = clamp(norm.rebuildPace - pace(round.rebuildSeconds, round.pieceCount), -1, 1);
  return 1 + (SPEED_SWING * (study + rebuild)) / 2;
}

const bounded = (rating: number): number => clamp(Math.round(rating), 0, MAX_SKILL_RATING);

/**
 * The rating after a rated round. `history` is the player's earlier rated rounds, newest first; while it holds fewer
 * than PLACEMENT_ROUNDS the round is a placement round, which moves the rating by a tenth of its performance's
 * distance from the start, so a player who starts at START_RATING stands at their mean performance once placement ends.
 */
export function ratingAfter(currentRating: number, history: readonly RatedRoundFacts[], round: RatedRoundFacts): RatingResult {
  const norm = history.length >= PLACEMENT_ROUNDS ? normOf(history) : null;
  if (!norm) {
    const { level, gate, performance } = performanceOf(round);
    const rating = bounded(currentRating + (performance - START_RATING) / PLACEMENT_ROUNDS);
    return {
      phase: "placement",
      rating,
      change: rating - currentRating,
      breakdown: { round: history.length + 1, of: PLACEMENT_ROUNDS, boardLevel: level, gate, performance },
    };
  }

  const level = boardLevel(round);
  const expected = 1 / (1 + 10 ** (Math.min(level - currentRating, HARDER_GAP_CAP) / ELO_SCALE));
  const outcome = outcomeOf(round.accuracy);
  const base = K * (outcome - expected);
  const gained = base > 0;
  const { direction, sigmas, weight } = riskOf(level, norm);
  const multiplier = riskMultiplier(direction, weight, gained);
  const speed = speedOf(round, norm);
  const outgrown = gained && currentRating - level >= NO_GAIN_GAP;
  const raw = outgrown ? 0 : base * multiplier * (gained ? speed : 1);
  const rating = bounded(currentRating + clamp(raw, -MAX_RATED_CHANGE, MAX_RATED_CHANGE));
  return {
    phase: "rated",
    rating,
    change: rating - currentRating,
    breakdown: { boardLevel: level, expected, outcome, base, risk: { direction, sigmas, multiplier }, speed },
  };
}

const isFiniteIn = (value: unknown, min: number, max: number): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;

/** Stored rounds are user-editable and may predate these facts, so anything not whole and in range is absent. */
export function parseRatedRoundFacts(value: unknown): RatedRoundFacts | null {
  if (typeof value !== "object" || value === null) return null;
  const { pieceCount, studySeconds, rebuildSeconds, accuracy } = value as Record<string, unknown>;
  if (!isFiniteIn(pieceCount, 1, 64) || !Number.isInteger(pieceCount)) return null;
  if (!isFiniteIn(studySeconds, 0, 3600) || !isFiniteIn(rebuildSeconds, 0, 86400) || !isFiniteIn(accuracy, 0, 100)) return null;
  return { pieceCount, studySeconds, rebuildSeconds, accuracy };
}
