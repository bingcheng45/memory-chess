import { ratingAfter, type RatedRoundFacts, type RatingResult } from "./rating";

/**
 * What a scored round did to the rating. A placement or rated round is the engine's result. The day's first empty
 * board is a free skip, kept for a round started by accident, and a review replays a board already seen; neither
 * moves the rating.
 */
export type RoundOutcome =
  | RatingResult
  | { readonly phase: "freeSkip"; readonly rating: number; readonly change: 0 }
  | { readonly phase: "review"; readonly rating: number; readonly change: 0 };

export type OutcomePhase = RoundOutcome["phase"];

/** `rated`: the round joins the rated history and moves the win streak. `spendsFreeSkip`: the day's free skip is used. */
export const outcomeEffects: { readonly [P in OutcomePhase]: { readonly rated: boolean; readonly spendsFreeSkip: boolean } } = {
  placement: { rated: true, spendsFreeSkip: false },
  rated: { rated: true, spendsFreeSkip: false },
  freeSkip: { rated: false, spendsFreeSkip: true },
  review: { rated: false, spendsFreeSkip: false },
};

export interface ScoredRound {
  readonly review: boolean;
  /** Pieces on the board when it was submitted, right or wrong. */
  readonly placedPieces: number;
  /** The local day the round ended, as `localDayOf` writes it. */
  readonly day: string;
  /** The local day the last free skip was used, null if never. */
  readonly freeSkipDay: string | null;
  readonly facts: RatedRoundFacts;
}

/** `history` is the player's earlier rated rounds, newest first, as `ratingAfter` reads it. */
export function roundOutcomeOf(currentRating: number, history: readonly RatedRoundFacts[], round: ScoredRound): RoundOutcome {
  if (round.review) return { phase: "review", rating: currentRating, change: 0 };
  if (round.placedPieces === 0 && round.freeSkipDay !== round.day) return { phase: "freeSkip", rating: currentRating, change: 0 };
  return ratingAfter(currentRating, history, round.facts);
}
