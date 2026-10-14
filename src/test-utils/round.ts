import type { SquareName } from "@/lib/game/board";
import { labPositionFromFen, roundReducer, type LabPiece, type RoundConfig, type RoundState } from "@/lib/round/round";

/** A round played through the real reducer: `target` studied, `placed` rebuilt piece by piece, then submitted. */
export function scoredRound(
  target: string,
  placed: string,
  config: RoundConfig = { pieceCount: 5, studyMs: 10000, source: "game_form" },
): Extract<RoundState, { phase: "scored" }> {
  let state = roundReducer({ phase: "idle" }, { type: "start", config, target: labPositionFromFen(target), now: 0 });
  state = roundReducer(state, { type: "studyEnded", now: 8250 });
  for (const [square, piece] of Object.entries(labPositionFromFen(placed)) as [SquareName, LabPiece][]) {
    state = roundReducer(state, { type: "select", piece });
    state = roundReducer(state, { type: "tapSquare", square, now: 10000 });
    state = roundReducer(state, { type: "select", piece });
  }
  state = roundReducer(state, { type: "submit", now: 20750 });
  if (state.phase !== "scored") throw new Error(`the round ended in the ${state.phase} phase`);
  return state;
}
