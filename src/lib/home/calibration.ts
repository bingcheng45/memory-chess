import type { PieceColor, PieceType } from "@/types/chess";
import { DIFFICULTY_PRESETS } from "@/types/game";
import type { RankedDifficulty } from "@/lib/reference/facts";

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
  pieceCount: 6,
  studyMs: 8000,
} as const;

// Weighted towards the pieces a real position has more of.
const NON_KING_POOL: readonly PieceType[] = [
  "queen",
  "rook",
  "rook",
  "bishop",
  "bishop",
  "knight",
  "knight",
  "pawn",
  "pawn",
  "pawn",
  "pawn",
];

function pick<T>(items: readonly T[], random: () => number): T {
  return items[Math.floor(random() * items.length)];
}

function randomColor(random: () => number): PieceColor {
  return random() < 0.5 ? "white" : "black";
}

function isBackRank(square: SquareName): boolean {
  return square.endsWith("1") || square.endsWith("8");
}

/** One king plus `pieceCount - 1` other pieces, no pawns on a back rank. */
export function generatePosition(
  random: () => number,
  pieceCount: number = CALIBRATION_RULES.pieceCount,
): LabPosition {
  const pieces: LabPiece[] = [
    { color: randomColor(random), type: "king" },
    ...Array.from({ length: pieceCount - 1 }, () => ({
      color: randomColor(random),
      type: pick(NON_KING_POOL, random),
    })),
  ];

  return pieces.reduce<LabPosition>((position, piece) => {
    const open = BOARD_SQUARES.filter(
      (square) => !position[square] && !(piece.type === "pawn" && isBackRank(square)),
    );
    return { ...position, [pick(open, random)]: piece };
  }, {});
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
  /** Placed pieces that do not match the target on their square. */
  readonly wrong: number;
  readonly byType: readonly TypeRecall[];
}

function samePiece(a: LabPiece | undefined, b: LabPiece | undefined): boolean {
  return a !== undefined && b !== undefined && a.color === b.color && a.type === b.type;
}

function occupied(position: LabPosition): SquareName[] {
  return BOARD_SQUARES.filter((square) => position[square]);
}

// Same rule as calculateAccuracy in src/lib/store/gameStore.ts, so a reading
// here means what the same result means in a real round.
const EXTRA_PIECE_PENALTY = 10;

export function scoreReading(target: LabPosition, placed: LabPosition): Score {
  const targetSquares = occupied(target);
  const placedSquares = occupied(placed);
  const total = targetSquares.length;
  const correct = targetSquares.filter((square) => samePiece(target[square], placed[square])).length;
  const wrong = placedSquares.filter((square) => !samePiece(target[square], placed[square])).length;
  const extra = Math.max(0, placedSquares.length - total);
  const base = total === 0 ? 0 : Math.round((correct / total) * 100);

  const byType = PIECE_TYPE_ORDER.flatMap((type) => {
    const squares = targetSquares.filter((square) => target[square]?.type === type);
    if (squares.length === 0) return [];
    const hits = squares.filter((square) => samePiece(target[square], placed[square])).length;
    return [{ type, correct: hits, total: squares.length }];
  });

  return {
    accuracy: Math.max(0, base - extra * EXTRA_PIECE_PENALTY),
    correct,
    total,
    wrong,
    byType,
  };
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

// Best first. A calibration round is six pieces at eight seconds, a little
// harder than Medium, so a clean reading points one preset up.
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
      if (!state.selected) return state;
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
