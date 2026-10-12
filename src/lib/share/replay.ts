import type { PlacedPiece, ScoredBoard } from "@/components/game/roundShare";
import { BOARD_SQUARES, type SquareName } from "@/lib/game/board";
import { squareVerdict, type LabPiece } from "@/lib/round/round";

/** A shared round as its page replays it: the board it was scored on and the two times the player took. */
export interface ReplayRound {
  readonly board: ScoredBoard;
  readonly studySeconds: number;
  readonly rebuildSeconds: number;
}

export type ReplayPhase = "study" | "clear" | "rebuild" | "scored";

/** Where the replay stands: a phase, and the seconds of the round played into it. */
export interface ReplayCursor {
  readonly phase: ReplayPhase;
  readonly elapsed: number;
}

/** The cleared board between study and rebuild is a beat of the replay, not a time the round measured. */
export const CLEAR_SECONDS = 1;

export const REPLAY_START: ReplayCursor = { phase: "study", elapsed: 0 };

/** A round whose order the log lost has no rebuild to play, so it goes from the cleared board to the score. */
export function replayPhases(round: ReplayRound): readonly ReplayPhase[] {
  return round.board.order ? ["study", "clear", "rebuild", "scored"] : ["study", "clear", "scored"];
}

export function phaseSeconds(round: ReplayRound, phase: ReplayPhase): number {
  return { study: round.studySeconds, clear: CLEAR_SECONDS, rebuild: round.rebuildSeconds, scored: 0 }[phase];
}

/** The cursor `seconds` later, carried into the next phases as each runs out, and held at the score. */
export function advance(round: ReplayRound, cursor: ReplayCursor, seconds: number): ReplayCursor {
  const phases = replayPhases(round);
  let { phase, elapsed } = { phase: cursor.phase, elapsed: cursor.elapsed + seconds };
  while (phase !== "scored" && elapsed > phaseSeconds(round, phase)) {
    elapsed -= phaseSeconds(round, phase);
    phase = phases[phases.indexOf(phase) + 1];
  }
  return { phase, elapsed: phase === "scored" ? 0 : elapsed };
}

/** The pieces of the order already down at the cursor. */
export function piecesDown(round: ReplayRound, cursor: ReplayCursor): readonly PlacedPiece[] {
  const order = round.board.order ?? [];
  if (cursor.phase === "scored") return order;
  return cursor.phase === "rebuild" ? order.filter(({ seconds }) => seconds <= cursor.elapsed) : [];
}

/** What one square shows: a piece, a faint missed piece, its mark after the score, and its place in the order. */
export interface ReplaySquare {
  readonly piece?: LabPiece;
  readonly ghost?: LabPiece;
  readonly mark?: string;
  readonly turn?: number;
}

export function replayBoard(round: ReplayRound, cursor: ReplayCursor): Readonly<Record<SquareName, ReplaySquare>> {
  const { target, placed } = round.board;
  const down = new Map(piecesDown(round, cursor).map(({ square }, index) => [square, index + 1]));
  const view = (square: SquareName): ReplaySquare => {
    switch (cursor.phase) {
      case "study":
        return { piece: target[square] };
      case "clear":
        return {};
      case "rebuild":
        return down.has(square) ? { piece: placed[square], turn: down.get(square) } : {};
      case "scored":
        return { piece: placed[square], ghost: placed[square] ? undefined : target[square], mark: squareVerdict(target, placed, square) };
    }
  };
  return Object.fromEntries(BOARD_SQUARES.map((square) => [square, view(square)])) as Record<SquareName, ReplaySquare>;
}

/** The scored board's marks counted, so the legend can say them in words as well as colour. */
export function markCounts({ target, placed }: ScoredBoard): { readonly correct: number; readonly missed: number; readonly wrong: number } {
  const verdicts = BOARD_SQUARES.map((square) => squareVerdict(target, placed, square)?.split(" ") ?? []);
  const count = (word: string) => verdicts.filter((words) => words.includes(word)).length;
  return { correct: count("ok"), missed: count("miss"), wrong: count("wrong") };
}
