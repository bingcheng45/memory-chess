import type { PieceColor, PieceType } from "@/types/chess";
import { DIFFICULTY_PRESETS } from "@/types/game";
import { DEFAULT_PRESET } from "@/lib/game/configPrefill";
import { STANDARD_INVENTORY } from "@/lib/game/pieceInventory";
import { placementFromFen, scorePlacement, type Placement } from "@/lib/game/scoring";
import type { RankedDifficulty } from "@/lib/reference/facts";
import { mapChessJsPieceToType, pieceTypeToFenChar } from "@/utils/chessPieces";

const FILE_LETTERS = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;

type FileLetter = (typeof FILE_LETTERS)[number];
type RankDigit = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8";

export type SquareName = `${FileLetter}${RankDigit}`;

export interface LabPiece {
  readonly color: PieceColor;
  readonly type: PieceType;
}

/** What sits where. A square with no entry is empty. */
export type LabPosition = Readonly<Partial<Record<SquareName, LabPiece>>>;

/** Board squares in reading order: a8 at index 0, h1 at index 63. */
export const BOARD_SQUARES: readonly SquareName[] = Array.from(
  { length: 64 },
  (_, index) => `${FILE_LETTERS[index % 8]}${8 - Math.floor(index / 8)}` as SquareName,
);

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

export const CALIBRATION_RULES = {
  pieceCount: DEFAULT_PRESET.pieceCount,
  studyMs: DEFAULT_PRESET.memorizeTime * 1000,
} as const;

export function labPositionFromFen(fen: string): LabPosition {
  return Object.fromEntries(
    Object.entries(placementFromFen(fen)).map(([square, char]) => [
      square,
      { color: char === char.toUpperCase() ? "white" : "black", type: mapChessJsPieceToType(char) },
    ]),
  );
}

/** The board part of a FEN, a8 first, the inverse of labPositionFromFen. */
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

/**
 * A position from the real game's generator. The import is dynamic so chess.js
 * stays out of the homepage bundle until a round starts.
 */
export async function loadCalibrationPosition(random: () => number = Math.random): Promise<LabPosition | null> {
  const { generateMemorizationPosition } = await import("@/lib/utils/memorizationPosition");
  const chess = generateMemorizationPosition(CALIBRATION_RULES.pieceCount, random);
  return chess ? labPositionFromFen(chess.fen()) : null;
}

/** How many more of this piece the standard set allows on the board. */
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
  /** Missed target pieces plus extra placed pieces, as the real game counts it. */
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
 * How a square reads after a submit, as space-separated words for a
 * `data-mark` attribute: "ok", "wrong" (a placed piece that does not belong),
 * "miss" (a target piece not recalled), or "wrong miss" for both at once.
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

export type TierAdvice = "stepUp" | "stay" | "start";

export interface TierSuggestion {
  readonly advice: TierAdvice;
  readonly difficulty: RankedDifficulty;
  readonly pieceCount: number;
  readonly memorizeTime: number;
}

// Best first. A calibration round is the Medium preset, so a clean reading
// points one preset up and a weak one points one down.
const TIER_LADDER: readonly {
  minAccuracy: number;
  advice: TierAdvice;
  difficulty: RankedDifficulty;
}[] = [
  { minAccuracy: 90, advice: "stepUp", difficulty: "hard" },
  { minAccuracy: 60, advice: "stay", difficulty: "medium" },
  { minAccuracy: 0, advice: "start", difficulty: "easy" },
];

export function suggestTier(accuracy: number): TierSuggestion {
  const rung = TIER_LADDER.find(({ minAccuracy }) => accuracy >= minAccuracy) ?? TIER_LADDER[2];
  const { pieceCount, memorizeTime } = DIFFICULTY_PRESETS[rung.difficulty];
  return { advice: rung.advice, difficulty: rung.difficulty, pieceCount, memorizeTime };
}

export type RoundState =
  | { readonly phase: "idle" }
  | { readonly phase: "study"; readonly target: LabPosition }
  | {
      readonly phase: "rebuild";
      readonly target: LabPosition;
      readonly placed: LabPosition;
      readonly selected: LabPiece | null;
      readonly startedAt: number;
    }
  | {
      readonly phase: "scored";
      readonly target: LabPosition;
      readonly placed: LabPosition;
      readonly score: Score;
      readonly rebuildMs: number;
    };

export type RoundAction =
  | { readonly type: "start"; readonly target: LabPosition }
  | { readonly type: "studyEnded"; readonly now: number }
  | { readonly type: "select"; readonly piece: LabPiece }
  | { readonly type: "tapSquare"; readonly square: SquareName }
  | { readonly type: "clear" }
  | { readonly type: "submit"; readonly now: number };

function withoutSquare(position: LabPosition, square: SquareName): LabPosition {
  return Object.fromEntries(Object.entries(position).filter(([key]) => key !== square));
}

export function roundReducer(state: RoundState, action: RoundAction): RoundState {
  if (action.type === "start") return { phase: "study", target: action.target };
  if (action.type === "studyEnded") {
    return state.phase === "study"
      ? { phase: "rebuild", target: state.target, placed: {}, selected: null, startedAt: action.now }
      : state;
  }
  if (state.phase !== "rebuild") return state;

  switch (action.type) {
    case "select":
      return { ...state, selected: samePiece(state.selected ?? undefined, action.piece) ? null : action.piece };
    case "tapSquare": {
      const current = state.placed[action.square];
      // A tap with no piece selected, or with the piece already there, lifts it.
      if (current && (!state.selected || samePiece(current, state.selected))) {
        return { ...state, placed: withoutSquare(state.placed, action.square) };
      }
      if (!state.selected || remainingOf(state.placed, state.selected) <= 0) return state;
      return { ...state, placed: { ...state.placed, [action.square]: state.selected } };
    }
    case "clear":
      return { ...state, placed: {} };
    case "submit":
      return {
        phase: "scored",
        target: state.target,
        placed: state.placed,
        score: scoreReading(state.target, state.placed),
        rebuildMs: action.now - state.startedAt,
      };
  }
}
