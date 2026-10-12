"use client";

import { useMemo } from "react";
import { START_RATING, useGameStore } from "@/lib/store/gameStore";
import type { GameStanding } from "@/lib/lab/dashboard";
import type { RatedRound } from "@/lib/lab/history";

/** The standing the dashboard reads from a rating, a win streak and the rated rounds held, null before any was played. */
export function standingOf(rating: number, winStreak: number, history: readonly RatedRound[]): GameStanding | null {
  const played = history.length > 0 || rating !== START_RATING || winStreak > 0;
  const changes = history.flatMap(({ skillRatingChange }) => (skillRatingChange === undefined ? [] : [skillRatingChange]));
  return played ? { rating, winStreak, changes } : null;
}

/**
 * The game store's part of the dashboard: the rating, the win streak and each held round's rating change. The store
 * reads localStorage as it is created, which the server cannot, so nothing is returned until the page has `loaded`.
 */
export function useGameStanding(loaded: boolean): { readonly standing: GameStanding | null; readonly rated: readonly RatedRound[] } {
  const history = useGameStore((state) => state.history);
  const rating = useGameStore((state) => state.gameState.skillRating ?? START_RATING);
  const winStreak = useGameStore((state) => state.gameState.streak ?? 0);

  return useMemo(
    () => (loaded ? { standing: standingOf(rating, winStreak, history), rated: history } : { standing: null, rated: [] }),
    [loaded, history, rating, winStreak],
  );
}
