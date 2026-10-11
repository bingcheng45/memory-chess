import type { PieceColor, PieceType } from "@/types/chess";
import type { RoundSource } from "@/lib/analytics/events";
import { BOARD_SQUARES, type SquareName } from "@/lib/game/board";
import { STANDARD_INVENTORY } from "@/lib/game/pieceInventory";
import { placementFromFen, scorePlacement, type Placement } from "@/lib/game/scoring";
import type { SetBoard } from "@/lib/types/game";
import { mapChessJsPieceToType, pieceTypeToFenChar } from "@/utils/chessPieces";
import { logPlacement, logRemovals, startPlacementLog, type PlacementLog } from "@/lib/lab/placements";

export interface LabPiece {
  readonly color: PieceColor;
  readonly type: PieceType;
}

export type LabPosition = Readonly<Partial<Record<SquareName, LabPiece>>>;

export function isDarkSquare(index: number): boolean {
  return ((index % 8) + Math.floor(index / 8)) % 2 === 1;
}

export const PIECE_TYPE_ORDER: readonly PieceType[] = [
  "king",
  "queen",
  "rook",
  "bishop",
  "knight",
  "pawn",
];

export function labPositionFromFen(fen: string): LabPosition {
  return Object.fromEntries(
    Object.entries(placementFromFen(fen)).map(([square, char]) => [
      square,
      { color: char === char.toUpperCase() ? "white" : "black", type: mapChessJsPieceToType(char) },
    ]),
  );
}

export function labPositionToFen(position: LabPosition): string {
  return Array.from({ length: 8 }, (_, row) =>
    BOARD_SQUARES.slice(row * 8, row * 8 + 8)
      .map((square) => {
        const piece = position[square];
        return piece ? pieceTypeToFenChar(piece.type, piece.color) : "1";
      })
      .join("")
      .replace(/1+/g, (run) => String(run.length)),
  ).join("/");
}

function remainingOf(position: LabPosition, piece: LabPiece): number {
  const used = Object.values(position).filter((placed) => samePiece(placed, piece)).length;
  return STANDARD_INVENTORY[piece.type] - used;
}

export interface TypeRecall {
  readonly type: PieceType;
  readonly correct: number;
  readonly total: number;
}

export interface Score {
  readonly accuracy: number;
  readonly correct: number;
  readonly total: number;
  readonly wrong: number;
  readonly byType: readonly TypeRecall[];
}

function samePiece(a: LabPiece | undefined, b: LabPiece | undefined): boolean {
  return a !== undefined && b !== undefined && a.color === b.color && a.type === b.type;
}

function occupied(position: LabPosition): SquareName[] {
  return BOARD_SQUARES.filter((square) => position[square]);
}

function toPlacement(position: LabPosition): Placement {
  return Object.fromEntries(
    occupied(position).map((square) => {
      const { type, color } = position[square] as LabPiece;
      return [square, pieceTypeToFenChar(type, color)];
    }),
  );
}

export function scoreReading(target: LabPosition, placed: LabPosition): Score {
  const { accuracy, correct, total, totalWrong } = scorePlacement(toPlacement(target), toPlacement(placed));
  const targetSquares = occupied(target);
  const byType = PIECE_TYPE_ORDER.flatMap((type) => {
    const squares = targetSquares.filter((square) => target[square]?.type === type);
    if (squares.length === 0) return [];
    const hits = squares.filter((square) => samePiece(target[square], placed[square])).length;
    return [{ type, correct: hits, total: squares.length }];
  });

  return { accuracy, correct, total, wrong: totalWrong, byType };
}

/**
 * How a square reads after a submit, as space-separated words for the board's
 * `data-mark` selectors: "ok", "wrong", "miss", or "wrong miss" for both.
 */
export function squareVerdict(
  target: LabPosition,
  placed: LabPosition,
  square: SquareName,
): string | undefined {
  if (samePiece(target[square], placed[square])) return "ok";
  const words = [placed[square] && "wrong", target[square] && "miss"].filter(Boolean);
  return words.length > 0 ? words.join(" ") : undefined;
}

/** What a round is played at and where it came from. `board` is set when the round plays a set position. */
export interface RoundConfig {
  readonly pieceCount: number;
  readonly studyMs: number;
  readonly source: RoundSource;
  readonly board?: SetBoard;
}

export type RoundState =
  | { readonly phase: "idle" }
  | { readonly phase: "study"; readonly config: RoundConfig; readonly target: LabPosition; readonly startedAt: number }
  | {
      readonly phase: "rebuild";
      readonly config: RoundConfig;
      readonly target: LabPosition;
      readonly placed: LabPosition;
      readonly selected: LabPiece | null;
      readonly studyMs: number;
      readonly log: PlacementLog;
    }
  | {
      readonly phase: "scored";
      readonly config: RoundConfig;
      readonly target: LabPosition;
      readonly placed: LabPosition;
      readonly score: Score;
      readonly rebuildMs: number;
      readonly studyMs: number;
      readonly log: PlacementLog;
    };

export type RoundPhase = RoundState["phase"];

export type RoundAction =
  | { readonly type: "start"; readonly config: RoundConfig; readonly target: LabPosition; readonly now: number }
  | { readonly type: "studyEnded"; readonly now: number }
  | { readonly type: "select"; readonly piece: LabPiece }
  | { readonly type: "tapSquare"; readonly square: SquareName; readonly now: number }
  | { readonly type: "clear" }
  | { readonly type: "submit"; readonly now: number };

/** What the board and its palette send: a piece picked, a square tapped. */
export type BoardAction = Extract<RoundAction, { type: "select" | "tapSquare" }>;

export const IDLE_ROUND: RoundState = { phase: "idle" };

function withoutSquare(position: LabPosition, square: SquareName): LabPosition {
  return Object.fromEntries(Object.entries(position).filter(([key]) => key !== square));
}

export function roundReducer(state: RoundState, action: RoundAction): RoundState {
  if (action.type === "start") {
    return { phase: "study", config: action.config, target: action.target, startedAt: action.now };
  }
  if (action.type === "studyEnded") {
    return state.phase === "study"
      ? {
          phase: "rebuild",
          config: state.config,
          target: state.target,
          placed: {},
          selected: null,
          // A hidden tab gets no timers, so the deadline can fire long after it passed. The player only ever saw the
          // configured time, and this figure feeds the time bonus and the leaderboard.
          studyMs: Math.min(state.config.studyMs, action.now - state.startedAt),
          log: startPlacementLog(action.now),
        }
      : state;
  }
  if (state.phase !== "rebuild") return state;

  switch (action.type) {
    case "select":
      return { ...state, selected: samePiece(state.selected ?? undefined, action.piece) ? null : action.piece };
    case "tapSquare": {
      const current = state.placed[action.square];
      if (current && (!state.selected || samePiece(current, state.selected))) {
        return { ...state, placed: withoutSquare(state.placed, action.square), log: logRemovals(state.log) };
      }
      if (!state.selected || remainingOf(state.placed, state.selected) <= 0) return state;
      const piece = pieceTypeToFenChar(state.selected.type, state.selected.color);
      return {
        ...state,
        placed: { ...state.placed, [action.square]: state.selected },
        log: logPlacement(logRemovals(state.log, current ? 1 : 0), action.now, action.square, piece),
      };
    }
    case "clear":
      return { ...state, placed: {}, log: logRemovals(state.log, occupied(state.placed).length) };
    case "submit":
      return {
        phase: "scored",
        config: state.config,
        target: state.target,
        placed: state.placed,
        score: scoreReading(state.target, state.placed),
        rebuildMs: action.now - state.log.startedAt,
        studyMs: state.studyMs,
        log: state.log,
      };
  }
}
