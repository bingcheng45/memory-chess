import { ratingAfter, type PlayerRating, type RatedRoundFacts, type RatingResult } from "./rating";

/**
 * What a scored round did to the rating. A provisional or rated round is the engine's result. The day's first empty
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
  provisional: { rated: true, spendsFreeSkip: false },
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

export function roundOutcomeOf(player: PlayerRating, round: ScoredRound): RoundOutcome {
  if (round.review) return { phase: "review", rating: player.rating, change: 0 };
  if (round.placedPieces === 0 && round.freeSkipDay !== round.day) return { phase: "freeSkip", rating: player.rating, change: 0 };
  return ratingAfter(player, round.facts);
}
