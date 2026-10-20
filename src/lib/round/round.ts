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

/** Copies of a piece still in the palette: the standard set less what the position already holds. */
export function remainingOf(position: LabPosition, piece: LabPiece): number {
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

/** The piece that belonged on a square the player filled with a different one, which the wrong piece would hide. */
export function hiddenAnswer(target: LabPosition, placed: LabPosition, square: SquareName): LabPiece | undefined {
  return placed[square] && !samePiece(target[square], placed[square]) ? target[square] : undefined;
}

/**
 * What a round is played at and where it came from. `board` is set when the round plays a set position. `blindfold`
 * studies the position as notation over an empty board; absent, the round studies the pieces on the board.
 */
export interface RoundConfig {
  readonly pieceCount: number;
  readonly studyMs: number;
  readonly source: RoundSource;
  readonly board?: SetBoard;
  readonly blindfold?: true;
}

/** A piece the player reached for after every copy was on the board; `attempt` counts the tries in a row. */
export interface Refusal {
  readonly piece: LabPiece;
  readonly attempt: number;
}

/** The three seconds between Start, or a replay, and the board appearing. */
export const COUNTDOWN_MS = 3000;

export type RoundState =
  | { readonly phase: "idle" }
  | { readonly phase: "ready"; readonly config: RoundConfig; readonly fen: string }
  | { readonly phase: "countdown"; readonly config: RoundConfig; readonly fen: string; readonly endsAt: number; readonly afterIntro?: true }
  | { readonly phase: "study"; readonly config: RoundConfig; readonly target: LabPosition; readonly startedAt: number }
  | {
      readonly phase: "rebuild";
      readonly config: RoundConfig;
      readonly target: LabPosition;
      readonly placed: LabPosition;
      readonly selected: LabPiece | null;
      readonly refused: Refusal | null;
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
  | { readonly type: "prepare"; readonly config: RoundConfig; readonly fen: string }
  | { readonly type: "begin"; readonly now: number }
  | { readonly type: "countIn"; readonly config: RoundConfig; readonly fen: string; readonly now: number }
  | { readonly type: "countdownEnded"; readonly now: number }
  | { readonly type: "studyEnded"; readonly now: number }
  | { readonly type: "select"; readonly piece: LabPiece }
  | { readonly type: "tapSquare"; readonly square: SquareName; readonly now: number }
  | { readonly type: "grab"; readonly piece: LabPiece }
  | { readonly type: "place"; readonly piece: LabPiece; readonly square: SquareName; readonly now: number }
  | { readonly type: "move"; readonly from: SquareName; readonly to: SquareName; readonly now: number }
  | { readonly type: "remove"; readonly square: SquareName }
  | { readonly type: "clear" }
  | { readonly type: "submit"; readonly now: number };

/** What the board and its palette send: a piece picked or grabbed, a square tapped, a piece dropped or dragged off. */
export type BoardAction = Extract<RoundAction, { type: "select" | "tapSquare" | "grab" | "place" | "move" | "remove" }>;

type RebuildState = Extract<RoundState, { phase: "rebuild" }>;

export const IDLE_ROUND: RoundState = { phase: "idle" };

function withoutSquare(position: LabPosition, square: SquareName): LabPosition {
  return Object.fromEntries(Object.entries(position).filter(([key]) => key !== square));
}

function refuse(state: RebuildState, piece: LabPiece): RebuildState {
  return { ...state, refused: { piece, attempt: (state.refused?.attempt ?? 0) + 1 } };
}

function lift(state: RebuildState, square: SquareName): RebuildState {
  return { ...state, placed: withoutSquare(state.placed, square), log: logRemovals(state.log) };
}

/** Puts `piece` on `square`, replacing whatever stood there; refused once every copy is on the board. */
function put(state: RebuildState, piece: LabPiece, square: SquareName, now: number): RebuildState {
  if (remainingOf(state.placed, piece) <= 0) return refuse(state, piece);
  const current = state.placed[square];
  return {
    ...state,
    placed: { ...state.placed, [square]: piece },
    log: logPlacement(logRemovals(state.log, current ? 1 : 0), now, square, pieceTypeToFenChar(piece.type, piece.color)),
  };
}

function rebuildReducer(
  state: RebuildState,
  action: Exclude<RoundAction, { type: "start" | "prepare" | "begin" | "countIn" | "countdownEnded" | "studyEnded" | "submit" }>,
): RebuildState {
  switch (action.type) {
    case "select": {
      if (samePiece(state.selected ?? undefined, action.piece)) return { ...state, selected: null };
      // Picking a used-up piece still selects it, as tapping one of its copies with it lifts that copy to move it.
      const picked = { ...state, selected: action.piece };
      return remainingOf(state.placed, action.piece) <= 0 ? refuse(picked, action.piece) : picked;
    }
    case "grab":
      if (remainingOf(state.placed, action.piece) <= 0) return refuse(state, action.piece);
      return state.refused ? { ...state, refused: null } : state;
    case "tapSquare": {
      const current = state.placed[action.square];
      if (current && (!state.selected || samePiece(current, state.selected))) return lift(state, action.square);
      return state.selected ? put(state, state.selected, action.square, action.now) : state;
    }
    case "place":
      return samePiece(state.placed[action.square], action.piece)
        ? state
        : put(state, action.piece, action.square, action.now);
    case "move": {
      const piece = state.placed[action.from];
      if (!piece || action.from === action.to) return state;
      return put(lift(state, action.from), piece, action.to, action.now);
    }
    case "remove":
      return state.placed[action.square] ? lift(state, action.square) : state;
    case "clear":
      return { ...state, placed: {}, log: logRemovals(state.log, occupied(state.placed).length) };
  }
}

export function roundReducer(state: RoundState, action: RoundAction): RoundState {
  if (action.type === "start") {
    return { phase: "study", config: action.config, target: action.target, startedAt: action.now };
  }
  if (action.type === "prepare") return state.phase === "idle" ? { phase: "ready", config: action.config, fen: action.fen } : state;
  if (action.type === "begin") {
    return state.phase === "ready"
      ? { phase: "countdown", config: state.config, fen: state.fen, endsAt: action.now + COUNTDOWN_MS, ...(state.config.board ? {} : { afterIntro: true }) }
      : state;
  }
  if (action.type === "countIn") {
    return { phase: "countdown", config: action.config, fen: action.fen, endsAt: action.now + COUNTDOWN_MS };
  }
  if (action.type === "countdownEnded") {
    return state.phase === "countdown"
      ? { phase: "study", config: state.config, target: labPositionFromFen(state.fen), startedAt: action.now }
      : state;
  }
  if (action.type === "studyEnded") {
    return state.phase === "study"
      ? {
          phase: "rebuild",
          config: state.config,
          target: state.target,
          placed: {},
          selected: null,
          refused: null,
          // A hidden tab gets no timers, so the deadline can fire long after it passed. The player only ever saw the
          // configured time, and this figure feeds the time bonus and the leaderboard.
          studyMs: Math.min(state.config.studyMs, action.now - state.startedAt),
          log: startPlacementLog(action.now),
        }
      : state;
  }
  if (state.phase !== "rebuild") return state;
  if (action.type === "submit") {
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

  const next = rebuildReducer(state, action);
  // A refusal stands until the next thing the player does that works.
  return next === state || next.refused !== state.refused ? next : { ...next, refused: null };
}
