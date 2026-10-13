/**
 * The skill rating. Placement estimates the first rating from the first rated rounds; after that each round is an
 * Elo game against its challenge, and how it counts is read against the player's own recent rounds: boards far from
 * their usual ones amplify or soften the result, their usual pace adds a little variance, and how their recent rounds
 * compare with their rating speeds the rating toward them. Pure and store-free, so the store, the tests and
 * scripts/rating/simulate.mjs all run the same engine.
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
  /** The board plus what the rebuild speed earned: the rating this round is an even result for. */
  readonly challenge: number;
  /** The rating every placement round so far suggests together, which the rating moves toward. */
  readonly estimate: number;
}

export interface RatedBreakdown {
  readonly boardLevel: number;
  readonly challenge: number;
  readonly expected: number;
  readonly outcome: number;
  /** K × (outcome − expected), before the multipliers. */
  readonly base: number;
  readonly risk: { readonly direction: RiskDirection; readonly sigmas: number; readonly multiplier: number };
  /** Mean outcome minus expected over the norm rounds at the current rating: above 0 when the player has outplayed it. */
  readonly form: { readonly surprise: number; readonly multiplier: number };
  /** Applied to a gain only. */
  readonly speed: number;
}

export type RatingResult =
  | { readonly phase: "placement"; readonly rating: number; readonly change: number; readonly breakdown: PlacementBreakdown }
  | { readonly phase: "rated"; readonly rating: number; readonly change: number; readonly breakdown: RatedBreakdown };

/** What the setup card shows before a round: the board on the rating scale and how far this round can move the rating. */
export interface RatingPreview {
  readonly phase: RatingResult["phase"];
  readonly difficultyRating: number;
  readonly maxGain: number;
  readonly maxLoss: number;
}

/** Medium, 6 pieces studied for 10 seconds, is a board of level START_RATING. */
const REFERENCE_PIECES = 6;
const REFERENCE_STUDY_SECONDS = 10;
/** Level per doubling of the pieces at the same study time per piece. */
const PIECE_WEIGHT = 400;
/** Level per halving of the study time at the same piece count. */
const STUDY_WEIGHT = 150;
/** Study time is counted between these, so pressing Done at once cannot make a board look endlessly hard. */
const STUDY_SECONDS_RANGE = { min: 1, max: 60 } as const;

/** The smallest weight: challenge per halving of the rebuild seconds per piece. */
const REBUILD_WEIGHT = 60;
const REFERENCE_REBUILD_PER_PIECE = 2.5;
/** Faster than this per piece earns nothing more, so an instant submit is not a fast rebuild. */
const REBUILD_FLOOR_PER_PIECE = 0.25;
/** Placement counts at most one halving of the rebuild time either way, so it stays the smallest dimension. */
const PLACEMENT_REBUILD_HALVINGS = 1;

/** At or under this accuracy a round is a full loss and earns no credit for its rebuild speed. */
const FLOOR_ACCURACY = 40;

const K = 32;
const ELO_SCALE = 400;
/** A challenge this far or more above the rating counts as only this far above: a gain stays bounded and a miss still costs. */
const HARDER_GAP_CAP = 400;
/** A challenge this far or more below the rating has nothing left to prove: clearing it earns nothing. */
const NO_GAIN_GAP = 500;
const MAX_RATED_CHANGE = 50;

/** Perfect rounds place a player at most this far above the hardest challenge they scored on, as in Elo's performance rating. */
const PERFECT_MARGIN = 400;
const MAX_PLACEMENT_CHANGE = 250;

/** ±5% of the player's usual effective piece count is their normal range. */
const NORMAL_BAND = (PIECE_WEIGHT + STUDY_WEIGHT) * Math.log2(1.05);
/** A player who always takes one board still has a spread, so a modest change is not read as extreme. */
const SPREAD_FLOOR = (PIECE_WEIGHT + STUDY_WEIGHT) * Math.log2(1.25);
const RISK_AMPLIFY = 0.5;
const RISK_SOFTEN = 0.5;
/** The most the speed variance moves a gain, either way. */
const SPEED_SWING = 0.15;
/** Form multiplier per unit of surprise, and the most it moves a gain or a loss either way. */
const FORM_WEIGHT = 4;
const FORM_SWING = 0.5;

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const studied = (seconds: number): number => clamp(seconds, STUDY_SECONDS_RANGE.min, STUDY_SECONDS_RANGE.max);

const mean = (values: readonly number[]): number => values.reduce((sum, value) => sum + value, 0) / values.length;

/**
 * The board on the rating scale. Pieces weigh most: doubling them at the same study time per piece adds PIECE_WEIGHT,
 * and doubling them in the same study time adds that plus STUDY_WEIGHT.
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

/** How much of the rebuild speed the accuracy earns: none at FLOOR_ACCURACY or under, all of it from a win. */
function gateOf(accuracy: number): number {
  return clamp((accuracy - FLOOR_ACCURACY) / (WIN_ACCURACY - FLOOR_ACCURACY), 0, 1);
}

const pace = (seconds: number, pieceCount: number): number => Math.log2(Math.max(seconds, 0.1) / pieceCount);

/** Halvings of the rebuild time per piece against the reference: up to one slower, and faster down to the floor. */
function rebuildHalvings({ pieceCount, rebuildSeconds }: RatedRoundFacts): number {
  const perPiece = Math.max(rebuildSeconds / pieceCount, REBUILD_FLOOR_PER_PIECE);
  return Math.max(Math.log2(REFERENCE_REBUILD_PER_PIECE / perPiece), -1);
}

/**
 * The rating this round is an even result for: its board, plus what the rebuild speed earned as far as the accuracy
 * allows. A full board studied for a second is the most the board offers; a faster rebuild keeps raising it.
 */
export function challengeOf(round: RatedRoundFacts, maxHalvings = Infinity): number {
  return boardLevel(round) + gateOf(round.accuracy) * REBUILD_WEIGHT * Math.min(rebuildHalvings(round), maxHalvings);
}

/** Elo's expected score at this rating against this challenge. */
const expectedAt = (rating: number, challenge: number): number =>
  1 / (1 + 10 ** (Math.min(challenge - rating, HARDER_GAP_CAP) / ELO_SCALE));

/**
 * The rating at which the rounds' outcomes match Elo's expectation, found by bisection: the score falls as the rating
 * rises. Rounds that were all perfect have no such rating, so they stop PERFECT_MARGIN above the hardest one.
 */
function placementEstimate(rounds: readonly RatedRoundFacts[]): number {
  const challenges = rounds.map((round) => challengeOf(round, PLACEMENT_REBUILD_HALVINGS));
  const surplus = (rating: number): number =>
    rounds.reduce((sum, round, i) => sum + outcomeOf(round.accuracy) - expectedAt(rating, challenges[i]), 0);
  let low = -MAX_SKILL_RATING;
  let high = 2 * MAX_SKILL_RATING;
  for (let step = 0; step < 50; step += 1) {
    const middle = (low + high) / 2;
    if (surplus(middle) > 0) low = middle;
    else high = middle;
  }
  const ceiling = Math.max(...challenges.filter((_, i) => outcomeOf(rounds[i].accuracy) > 0)) + PERFECT_MARGIN;
  return clamp(Math.min((low + high) / 2, ceiling), 0, MAX_SKILL_RATING);
}

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

/**
 * How the player's own recent rounds compare with their rating. A player who has been outplaying it gains more and
 * loses less until the rating catches up; one who has been underplaying it, the reverse. Zero for a player at their level.
 */
function formOf(rating: number, history: readonly RatedRoundFacts[], gained: boolean): RatedBreakdown["form"] {
  const rounds = history.slice(0, NORM_ROUNDS);
  const surprise = mean(rounds.map((round) => outcomeOf(round.accuracy) - expectedAt(rating, challengeOf(round))));
  const swing = clamp(FORM_WEIGHT * surprise, -FORM_SWING, FORM_SWING);
  return { surprise, multiplier: gained ? 1 + swing : 1 - swing };
}

/** Up to SPEED_SWING either way, half from study pace and half from rebuild pace against the player's own. */
function speedOf(round: RatedRoundFacts, norm: PlayerNorm): number {
  const study = clamp(norm.studyPace - pace(studied(round.studySeconds), round.pieceCount), -1, 1);
  const rebuild = clamp(norm.rebuildPace - pace(round.rebuildSeconds, round.pieceCount), -1, 1);
  return 1 + (SPEED_SWING * (study + rebuild)) / 2;
}

const bounded = (rating: number): number => clamp(Math.round(rating), 0, MAX_SKILL_RATING);

/** How far n placement rounds have moved a player from the start: a tenth of their estimate's distance per round. */
const placedShift = (rounds: readonly RatedRoundFacts[]): number =>
  rounds.length === 0 ? 0 : ((placementEstimate(rounds) - START_RATING) * rounds.length) / PLACEMENT_ROUNDS;

/**
 * A placement round moves the rating by how much it changes the placed shift, so a player who starts at START_RATING
 * stands at the estimate from all ten rounds once placement ends. The move is at most MAX_PLACEMENT_CHANGE and never
 * against the round's own result: a round below what the rating expected never raises it, and one above never lowers it.
 */
function placementRound(currentRating: number, history: readonly RatedRoundFacts[], round: RatedRoundFacts): RatingResult {
  const rounds = [round, ...history];
  const estimate = placementEstimate(rounds);
  const challenge = challengeOf(round, PLACEMENT_REBUILD_HALVINGS);
  const surprise = outcomeOf(round.accuracy) - expectedAt(currentRating, challenge);
  const shift = clamp(placedShift(rounds) - placedShift(history), -MAX_PLACEMENT_CHANGE, MAX_PLACEMENT_CHANGE);
  const rating = bounded(currentRating + (Math.sign(shift) === Math.sign(surprise) ? shift : 0));
  return {
    phase: "placement",
    rating,
    change: rating - currentRating,
    breakdown: { round: history.length + 1, of: PLACEMENT_ROUNDS, boardLevel: boardLevel(round), challenge, estimate },
  };
}

/**
 * The rating after a rated round. `history` is the player's earlier rated rounds, newest first; while it holds fewer
 * than PLACEMENT_ROUNDS the round is a placement round.
 */
export function ratingAfter(currentRating: number, history: readonly RatedRoundFacts[], round: RatedRoundFacts): RatingResult {
  const norm = history.length >= PLACEMENT_ROUNDS ? normOf(history) : null;
  if (!norm) return placementRound(currentRating, history, round);

  const level = boardLevel(round);
  const challenge = challengeOf(round);
  const expected = expectedAt(currentRating, challenge);
  const outcome = outcomeOf(round.accuracy);
  const base = K * (outcome - expected);
  const gained = base > 0;
  const { direction, sigmas, weight } = riskOf(level, norm);
  const multiplier = riskMultiplier(direction, weight, gained);
  const form = formOf(currentRating, history, gained);
  const speed = speedOf(round, norm);
  const outgrown = gained && currentRating - challenge >= NO_GAIN_GAP;
  const raw = outgrown ? 0 : base * multiplier * form.multiplier * (gained ? speed : 1);
  const rating = bounded(currentRating + clamp(raw, -MAX_RATED_CHANGE, MAX_RATED_CHANGE));
  return {
    phase: "rated",
    rating,
    change: rating - currentRating,
    breakdown: { boardLevel: level, challenge, expected, outcome, base, risk: { direction, sigmas, multiplier }, form, speed },
  };
}

/**
 * The setup card's preview, by the same engine: the board's level, and the change from a perfect round at the full
 * study time with the player's fastest recent rebuild pace, and from an empty one.
 */
export function ratingPreview(
  currentRating: number,
  history: readonly RatedRoundFacts[],
  board: Pick<RatedRoundFacts, "pieceCount" | "studySeconds">,
): RatingPreview {
  const recent = history.slice(0, NORM_ROUNDS);
  const fastest = recent.length > 0 ? Math.min(...recent.map(({ rebuildSeconds, pieceCount }) => rebuildSeconds / pieceCount)) : REFERENCE_REBUILD_PER_PIECE;
  const rebuildSeconds = board.pieceCount * fastest;
  const best = ratingAfter(currentRating, history, { ...board, rebuildSeconds, accuracy: 100 });
  const worst = ratingAfter(currentRating, history, { ...board, rebuildSeconds, accuracy: 0 });
  return { phase: best.phase, difficultyRating: bounded(boardLevel(board)), maxGain: best.change, maxLoss: worst.change };
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
