import { boardLevel } from "@/lib/game/rating";
import { accuracyOf } from "@/lib/game/scoring";
import type { DailySetting } from "./schedule";

/** One player's round on the daily board, as the estimate reads it. */
export interface DailyResult {
  /** The player's skill rating when they joined the board. */
  readonly rating: number;
  /** 0 to 1. */
  readonly score: number;
  readonly pieces: number;
}

/** The columns of a daily leaderboard row the estimate reads. */
export interface DailyResultRow {
  readonly piece_count: number;
  readonly correct_pieces: number;
  readonly total_wrong_pieces: number | null;
  readonly skill_rating: number | null;
}

/** Below this many results the estimate is barely off the board's formula level, so there is nothing worth showing. */
export const MIN_RESULTS = 25;

/** A player rated at the board's rating is expected to place 70% of it, and every 275 points above it doubles the odds. */
const LOGIT_AT_EVEN = Math.log(7 / 3);
const SLOPE = Math.LN2 / 275;
/** How far a day's board usually lands from its formula level. */
const PRIOR_SD = 150;
/** A result counts as at most this many standard errors from its expectation, so a few made-up rows cannot drag the estimate. */
const RESIDUAL_CLIP = 2;
/** Pieces are recalled in chunks of about this many, so a round's score varies more than independent pieces would. */
const CHUNK = 3;
const EXTRA_DISPERSION = 0.02;
const NEWTON_STEPS = 30;
const ROUND_TO = 10;

const expectedScore = (rating: number, board: number) => 1 / (1 + Math.exp(-(SLOPE * (rating - board) + LOGIT_AT_EVEN)));

/** Rows without a rating say nothing about how hard the board was for whom, so they are left out. */
export function dailyResultOf(row: DailyResultRow): DailyResult | null {
  if (row.skill_rating === null) return null;
  const extra = Math.max(0, (row.total_wrong_pieces ?? 0) - (row.piece_count - row.correct_pieces));
  return { rating: row.skill_rating, score: accuracyOf({ total: row.piece_count, correct: row.correct_pieces, extra }) / 100, pieces: row.piece_count };
}

/**
 * The rating a board played at, to the nearest 10: the maximum a posteriori estimate from the day's results, starting
 * from the board's formula level. Each result's residual is clipped, so rows claiming impossible ratings or scores move
 * it by a bounded amount. Null below MIN_RESULTS.
 */
export function boardRatingOf(results: readonly DailyResult[], prior: number): number | null {
  if (results.length < MIN_RESULTS) return null;
  let board = prior;
  for (let step = 0; step < NEWTON_STEPS; step += 1) {
    let gradient = -(board - prior) / PRIOR_SD ** 2;
    let curvature = 1 / PRIOR_SD ** 2;
    for (const { rating, score, pieces } of results) {
      const expected = expectedScore(rating, board);
      const dispersion = CHUNK / pieces + EXTRA_DISPERSION;
      const residual = (score - expected) / Math.sqrt(dispersion * expected * (1 - expected) + 1e-9);
      const clipped = Math.max(-RESIDUAL_CLIP, Math.min(RESIDUAL_CLIP, residual));
      gradient -= SLOPE * Math.sqrt((expected * (1 - expected)) / dispersion) * clipped;
      curvature += (SLOPE ** 2 * expected * (1 - expected)) / dispersion;
    }
    board += gradient / curvature;
  }
  return Math.round(board / ROUND_TO) * ROUND_TO;
}

/** How a day's board played, read from its leaderboard rows, with its setting's formula level as the starting point. */
export function playedLikeOf(rows: readonly DailyResultRow[], setting: DailySetting): number | null {
  const results = rows.flatMap((row) => dailyResultOf(row) ?? []);
  return boardRatingOf(results, boardLevel({ pieceCount: setting.pieceCount, studySeconds: setting.memorizeTime }));
}
