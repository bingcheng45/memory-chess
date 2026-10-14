import { NEW_PLAYER } from "@/lib/game/rating";
import { roundOutcomeOf, type ScoredRound } from "@/lib/game/roundOutcome";

const at = (rating: number) => ({ ...NEW_PLAYER, rating });

const empty: ScoredRound = {
  review: false,
  placedPieces: 0,
  day: "2026-10-14",
  freeSkipDay: null,
  facts: { pieceCount: 6, studySeconds: 10, rebuildSeconds: 3, accuracy: 0 },
};

describe("the outcome of a scored round", () => {
  it("makes the first empty board of the day a free skip that keeps the rating", () => {
    expect(roundOutcomeOf(at(1200), empty)).toEqual({ phase: "freeSkip", rating: 1200, change: 0 });
  });

  it("rates a second empty board the same day as a provisional loss", () => {
    const second = roundOutcomeOf(at(1000), { ...empty, freeSkipDay: "2026-10-14" });

    expect([second.phase, second.rating, second.change]).toEqual(["provisional", 600, -400]);
  });

  it("gives the next day's first empty board a free skip again", () => {
    expect(roundOutcomeOf(at(960), { ...empty, day: "2026-10-15", freeSkipDay: "2026-10-14" })).toEqual({
      phase: "freeSkip",
      rating: 960,
      change: 0,
    });
  });

  it("rates a board with one piece placed, wrong or not, as usual", () => {
    const one = roundOutcomeOf(at(1000), { ...empty, placedPieces: 1 });

    expect([one.phase, one.change]).toEqual(["provisional", -400]);
  });

  it("leaves a review unrated, empty or not, without spending the free skip", () => {
    expect(roundOutcomeOf(at(1100), { ...empty, review: true })).toEqual({ phase: "review", rating: 1100, change: 0 });
  });
});
