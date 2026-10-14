/**
 * The skill rating. A player's rating is the board level they recall about 70% of, held with an uncertainty (RD) that
 * shrinks as they play and widens a little each round. Each rated round compares the accuracy with what the rating
 * expects on that board and moves the rating by how sure the game is of it, in the style of Glicko. Pure and
 * store-free, so the store, the tests and scripts/rating/simulate.mjs all run the same engine.
 */

export const START_RATING = 1000;

export const MAX_SKILL_RATING = 5000;

/** The accuracy a rated round needs to extend the win streak. */
export const WIN_ACCURACY = 70;

/**
 * Every tunable number of the rating. Calibration from real rounds replaces these values and nothing else.
 * Board level: pieces per doubling; a look longer than the reference study time costs studyWeight per doubling, and a
 * shorter look earns studyWeight per halving of the look per piece at first, at most lookCreditPerPiece per piece.
 * Rebuild credit: rebuildWeight per halving under the reference pace plus its buffer, times √(pieces / reference pieces).
 * Expectation: E = 1 / (1 + (1 − even) / even · e^(−κ(R − b))), so a board at the player's rating expects `evenAccuracy`.
 * Noise: φ = chunk / max(pieces, minPieces) + noiseFloor, the variance of a round's accuracy around E.
 */
export const RATING_MODEL = {
  referencePieces: 6,
  referenceStudySeconds: 10,
  pieceWeight: 550,
  studyWeight: 150,
  studySecondsRange: { min: 1, max: 60 },
  lookCreditPerPiece: 12,
  /** The leaderboard's median rebuild time per piece. */
  referenceRebuildPerPiece: 2.5,
  rebuildBuffer: 0.2,
  rebuildWeight: 45,
  rebuildMaxHalvings: 2,

  kappa: Math.LN2 / 200,
  evenAccuracy: 0.7,
  chunk: 2,
  minPieces: 6,
  noiseFloor: 0.02,

  startRd: 350,
  driftRd: 6,
  /** RD stays at least startRd / (1 + rounds / this), so the first rounds keep moving the rating. */
  rdFloorRounds: 3,
  /** Provisional while RD is above this many steady-state RDs. */
  provisionalSpread: 2,
  provisionalCap: 400,
  establishedCap: 50,

  /** At or under this accuracy a round never gains and earns no rebuild credit. */
  floorAccuracy: 40,
  /** A board this far or more below the rating has nothing left to prove: clearing it earns nothing. */
  noGainGap: 500,

  suggestTarget: { provisional: 0.5, established: 0.75 },
} as const;

const M = RATING_MODEL;

export interface PlayerRating {
  readonly rating: number;
  /** Rating deviation: how unsure the game is of the rating, in rating points. */
  readonly rd: number;
  /** Rated rounds played under this rating. */
  readonly rounds: number;
}

export const NEW_PLAYER: PlayerRating = { rating: START_RATING, rd: M.startRd, rounds: 0 };

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

export type BoardSetting = Pick<RatedRoundFacts, "pieceCount" | "studySeconds">;

export type RatingPhase = "provisional" | "rated";

export interface RatingResult {
  /** Whether the rating after this round is still provisional. */
  readonly phase: RatingPhase;
  readonly rating: number;
  readonly change: number;
  readonly player: PlayerRating;
  readonly breakdown: {
    /** The board plus the rebuild credit: the rating this round is a 70% board for. */
    readonly challenge: number;
    /** Expected accuracy, 0 to 1. */
    readonly expected: number;
    readonly score: number;
  };
}

/** What the setup card shows before a round. */
export interface RatingPreview {
  readonly phase: RatingPhase;
  readonly difficultyRating: number;
  /** Percent. */
  readonly expectedAccuracy: number;
  /** A perfect round at the full study time and the player's fastest recent rebuild pace; studying less or rebuilding faster gains more. */
  readonly perfectGain: number;
  readonly maxLoss: number;
}

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const studied = (seconds: number): number => clamp(seconds, M.studySecondsRange.min, M.studySecondsRange.max);

const informationPer = (expected: number, phi: number): number => (M.kappa ** 2 * expected * (1 - expected)) / phi;

const noiseOf = (pieceCount: number): number => M.chunk / Math.max(pieceCount, M.minPieces) + M.noiseFloor;

/**
 * The RD a player settles at who keeps playing a reference board at their level: the fixed point of the drift and the
 * round's information, rd² = 1 / (1 / (rd² + drift²) + I), solved as I·x² + I·d²·x − d² = 0.
 */
export const STEADY_RD = (() => {
  const info = informationPer(M.evenAccuracy, noiseOf(M.referencePieces));
  const d2 = M.driftRd ** 2;
  return Math.sqrt((-info * d2 + Math.sqrt((info * d2) ** 2 + 4 * info * d2)) / (2 * info));
})();

export const PROVISIONAL_RD = M.provisionalSpread * STEADY_RD;

export const isProvisional = (player: PlayerRating): boolean => player.rd > PROVISIONAL_RD;

const phaseOf = (player: PlayerRating): RatingPhase => (isProvisional(player) ? "provisional" : "rated");

/**
 * What the look adds to the board: a look longer than the reference study time costs, and a shorter one earns by the
 * halvings of its look per piece against the reference time shared by as many pieces, each halving less than the one
 * before, up to a ceiling that grows with the pieces, so a glance at a small board cannot outscore a full one.
 */
function lookCredit({ pieceCount, studySeconds }: BoardSetting): number {
  const seconds = studied(studySeconds);
  const long = -M.studyWeight * Math.log2(Math.max(seconds, M.referenceStudySeconds) / M.referenceStudySeconds);
  const lookPerPiece = seconds / pieceCount;
  const referencePerPiece = M.referenceStudySeconds / pieceCount;
  const halvings = Math.max(0, Math.log2(referencePerPiece / lookPerPiece));
  const ceiling = M.lookCreditPerPiece * pieceCount;
  return long + ceiling * Math.tanh((M.studyWeight * halvings) / ceiling);
}

/** The board on the rating scale: pieces weigh most, then a shorter look per piece. */
export function boardLevel(board: BoardSetting): number {
  return START_RATING + M.pieceWeight * Math.log2(board.pieceCount / M.referencePieces) + lookCredit(board);
}

/** How much of the rebuild speed the accuracy earns: none at the floor accuracy or under, all of it from a win. */
const gateOf = (accuracy: number): number => clamp((accuracy - M.floorAccuracy) / (WIN_ACCURACY - M.floorAccuracy), 0, 1);

/**
 * What the rebuild speed earns: nothing at or slower than an everyday pace (the reference plus its buffer), then more
 * the faster it is, up to a ceiling, and more the more pieces were rebuilt at that pace.
 */
function rebuildCredit({ pieceCount, rebuildSeconds }: RatedRoundFacts): number {
  const everyday = M.referenceRebuildPerPiece * (1 + M.rebuildBuffer);
  const faster = clamp(Math.log2((everyday * pieceCount) / rebuildSeconds), 0, M.rebuildMaxHalvings);
  return M.rebuildWeight * faster * Math.sqrt(pieceCount / M.referencePieces);
}

/** The rating this round is a 70% board for: its board, plus what the rebuild speed earned as far as the accuracy allows. */
export function challengeOf(round: RatedRoundFacts): number {
  return boardLevel(round) + gateOf(round.accuracy) * rebuildCredit(round);
}

/** The accuracy, 0 to 1, a player of this rating is expected to reach on a board of this challenge. */
export function expectedAccuracy(rating: number, challenge: number): number {
  return 1 / (1 + ((1 - M.evenAccuracy) / M.evenAccuracy) * Math.exp(-M.kappa * (rating - challenge)));
}

/** The RD before a round: widened by the drift, at most the start RD, and at least the floor for the rounds played. */
function priorRd2({ rd, rounds }: PlayerRating): number {
  const floor = M.startRd / (1 + rounds / M.rdFloorRounds);
  return Math.max(Math.min(rd ** 2 + M.driftRd ** 2, M.startRd ** 2), floor ** 2);
}

/** The rating after a rated round. */
export function ratingAfter(player: PlayerRating, round: RatedRoundFacts): RatingResult {
  const challenge = challengeOf(round);
  const expected = expectedAccuracy(player.rating, challenge);
  const score = round.accuracy / 100;
  const phi = noiseOf(round.pieceCount);
  const post2 = 1 / (1 / priorRd2(player) + informationPer(expected, phi));
  const raw = (post2 * M.kappa * (score - expected)) / phi;
  const guarded = round.accuracy <= M.floorAccuracy || player.rating - challenge >= M.noGainGap ? Math.min(raw, 0) : raw;
  const rd = Math.sqrt(post2);
  const cap = rd > PROVISIONAL_RD ? M.provisionalCap : M.establishedCap;
  const rating = clamp(Math.round(player.rating + clamp(guarded, -cap, cap)), 0, MAX_SKILL_RATING);
  const next = { rating, rd, rounds: player.rounds + 1 };
  return { phase: phaseOf(next), rating, change: rating - player.rating, player: next, breakdown: { challenge, expected, score } };
}

/** Plays rated rounds oldest first. */
export const replay = (player: PlayerRating, rounds: readonly RatedRoundFacts[]): PlayerRating =>
  rounds.reduce((current, round) => ratingAfter(current, round).player, player);

/**
 * The setup card's preview, by the same engine: the board's level, the accuracy the rating expects on it, the change
 * from a perfect round at the full study time and the player's fastest recent rebuild pace, and the change from an
 * empty board, the most a round can lose. `recent` is the player's recent rated rounds, read only for that pace.
 */
export function ratingPreview(player: PlayerRating, recent: readonly RatedRoundFacts[], board: BoardSetting): RatingPreview {
  const fastest =
    recent.length > 0 ? Math.min(...recent.map(({ rebuildSeconds, pieceCount }) => rebuildSeconds / pieceCount)) : M.referenceRebuildPerPiece;
  const rebuildSeconds = board.pieceCount * fastest;
  const best = ratingAfter(player, { ...board, rebuildSeconds, accuracy: 100 });
  const worst = ratingAfter(player, { ...board, rebuildSeconds, accuracy: 0 });
  return {
    phase: phaseOf(player),
    difficultyRating: clamp(Math.round(boardLevel(board)), 0, MAX_SKILL_RATING),
    expectedAccuracy: Math.round(100 * expectedAccuracy(player.rating, boardLevel(board))),
    perfectGain: best.change,
    maxLoss: worst.change,
  };
}

export interface BoardRanges {
  readonly pieces: { readonly min: number; readonly max: number };
  readonly seconds: { readonly min: number; readonly max: number };
}

/**
 * The boards a suggestion picks from: every piece count at the reference study time, and the fewest and the most
 * pieces at every study time, which fill the wide steps between small piece counts and go past the full board.
 */
function candidatesOf({ pieces, seconds }: BoardRanges): BoardSetting[] {
  const span = ({ min, max }: { readonly min: number; readonly max: number }): number[] => Array.from({ length: max - min + 1 }, (_, i) => min + i);
  const study = clamp(M.referenceStudySeconds, seconds.min, seconds.max);
  return [
    ...span(pieces).map((pieceCount) => ({ pieceCount, studySeconds: study })),
    ...[pieces.min, pieces.max].flatMap((pieceCount) => span(seconds).map((studySeconds) => ({ pieceCount, studySeconds }))),
  ];
}

/** The board whose expected accuracy is nearest the target: an even board while provisional, which teaches the rating fastest, and 75% after. */
export function suggestBoard(player: PlayerRating, ranges: BoardRanges): BoardSetting {
  const target = isProvisional(player) ? M.suggestTarget.provisional : M.suggestTarget.established;
  const gap = (board: BoardSetting): number => Math.abs(expectedAccuracy(player.rating, boardLevel(board)) - target);
  return candidatesOf(ranges).reduce((best, board) => (gap(board) < gap(best) ? board : best));
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

/** A stored RD and round count, which are user-editable: anything out of range is a new player's. */
export function parseCertainty(value: unknown): Omit<PlayerRating, "rating"> {
  if (typeof value !== "object" || value === null) return { rd: M.startRd, rounds: 0 };
  const { rd, rounds } = value as Record<string, unknown>;
  if (!isFiniteIn(rd, 0, M.startRd) || !isFiniteIn(rounds, 0, Number.MAX_SAFE_INTEGER) || !Number.isInteger(rounds)) return { rd: M.startRd, rounds: 0 };
  return { rd, rounds };
}
