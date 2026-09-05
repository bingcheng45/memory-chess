import {
  Chess,
  type Color,
  type PieceSymbol,
  type Square,
  SQUARES,
} from "chess.js";

import { PIECE_COUNT_RANGE } from "@/lib/reference/facts";

export type PositionViolation =
  | "invalid-fen"
  | "piece-count"
  | "king-count"
  | "adjacent-kings"
  | "pawn-back-rank"
  | "bishop-color-complex"
  | "piece-inventory"
  | "simultaneous-check"
  | "checked-side-not-to-move";

export interface PositionValidationResult {
  readonly valid: boolean;
  readonly violations: readonly PositionViolation[];
  readonly whiteInCheck: boolean;
  readonly blackInCheck: boolean;
}

type RandomSource = () => number;

const MAX_GENERATION_ATTEMPTS = 32;
const COLORS: readonly Color[] = ["w", "b"];
const PIECE_WEIGHTS: Readonly<Record<Exclude<PieceSymbol, "k">, number>> = {
  p: 8,
  n: 2,
  b: 2,
  r: 2,
  q: 1,
};
const STANDARD_INVENTORY: Readonly<Record<PieceSymbol, number>> = {
  p: 8,
  n: 2,
  b: 2,
  r: 2,
  q: 1,
  k: 1,
};

const FALLBACK_POSITION: ReadonlyArray<{
  readonly square: Square;
  readonly type: PieceSymbol;
  readonly color: Color;
}> = [
  { square: "e1", type: "k", color: "w" },
  { square: "e8", type: "k", color: "b" },
  ...(["a2", "b2", "c2", "d2", "e2", "f2", "g2", "h2"] as Square[]).map(
    (square) => ({ square, type: "p" as const, color: "w" as const }),
  ),
  ...(["a7", "b7", "c7", "d7", "e7", "f7", "g7", "h7"] as Square[]).map(
    (square) => ({ square, type: "p" as const, color: "b" as const }),
  ),
  { square: "a1", type: "r", color: "w" },
  { square: "h1", type: "r", color: "w" },
  { square: "a8", type: "r", color: "b" },
  { square: "h8", type: "r", color: "b" },
  { square: "b1", type: "n", color: "w" },
  { square: "g1", type: "n", color: "w" },
  { square: "b8", type: "n", color: "b" },
  { square: "g8", type: "n", color: "b" },
  { square: "c1", type: "b", color: "w" },
  { square: "f1", type: "b", color: "w" },
  { square: "c8", type: "b", color: "b" },
  { square: "f8", type: "b", color: "b" },
  { square: "d1", type: "q", color: "w" },
  { square: "d8", type: "q", color: "b" },
];

function squareCoordinates(square: Square) {
  return {
    file: square.charCodeAt(0) - 97,
    rank: Number(square[1]) - 1,
  };
}

function squareColorComplex(square: Square): 0 | 1 {
  const { file, rank } = squareCoordinates(square);
  return ((file + rank) % 2) as 0 | 1;
}

function areSquaresAdjacent(first: Square, second: Square): boolean {
  const firstCoordinates = squareCoordinates(first);
  const secondCoordinates = squareCoordinates(second);
  return (
    Math.max(
      Math.abs(firstCoordinates.file - secondCoordinates.file),
      Math.abs(firstCoordinates.rank - secondCoordinates.rank),
    ) <= 1
  );
}

function chooseRandom<T>(
  values: readonly T[],
  random: RandomSource,
): T | undefined {
  if (values.length === 0) return undefined;
  const randomValue = Math.max(0, Math.min(0.999999999999, random()));
  return values[Math.floor(randomValue * values.length)];
}

function findKingSquare(chess: Chess, color: Color): Square | undefined {
  return SQUARES.find((square) => {
    const piece = chess.get(square);
    return piece?.type === "k" && piece.color === color;
  });
}

function getCheckState(chess: Chess) {
  const whiteKing = findKingSquare(chess, "w");
  const blackKing = findKingSquare(chess, "b");

  return {
    whiteInCheck: whiteKing ? chess.isAttacked(whiteKing, "b") : false,
    blackInCheck: blackKing ? chess.isAttacked(blackKing, "w") : false,
  };
}

export function validateMemorizationPosition(
  position: Chess | string,
  expectedPieceCount?: number,
): PositionValidationResult {
  let chess: Chess;

  try {
    chess =
      typeof position === "string"
        ? new Chess(position, { skipValidation: true })
        : position;
  } catch {
    return {
      valid: false,
      violations: ["invalid-fen"],
      whiteInCheck: false,
      blackInCheck: false,
    };
  }

  const violations = new Set<PositionViolation>();
  const inventory: Record<Color, Record<PieceSymbol, number>> = {
    w: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
    b: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
  };
  const bishops: Record<Color, Square[]> = { w: [], b: [] };
  const kings: Record<Color, Square[]> = { w: [], b: [] };
  let pieceCount = 0;

  SQUARES.forEach((square) => {
    const piece = chess.get(square);
    if (!piece) return;

    pieceCount += 1;
    inventory[piece.color][piece.type] += 1;

    if (piece.type === "k") kings[piece.color].push(square);
    if (piece.type === "b") bishops[piece.color].push(square);
    if (piece.type === "p" && (square[1] === "1" || square[1] === "8")) {
      violations.add("pawn-back-rank");
    }
  });

  if (expectedPieceCount !== undefined && pieceCount !== expectedPieceCount) {
    violations.add("piece-count");
  }

  COLORS.forEach((color) => {
    if (kings[color].length !== 1) violations.add("king-count");

    (Object.keys(STANDARD_INVENTORY) as PieceSymbol[]).forEach((type) => {
      if (inventory[color][type] > STANDARD_INVENTORY[type]) {
        violations.add("piece-inventory");
      }
    });

    if (
      bishops[color].length === 2 &&
      squareColorComplex(bishops[color][0]) ===
        squareColorComplex(bishops[color][1])
    ) {
      violations.add("bishop-color-complex");
    }
  });

  if (
    kings.w.length === 1 &&
    kings.b.length === 1 &&
    areSquaresAdjacent(kings.w[0], kings.b[0])
  ) {
    violations.add("adjacent-kings");
  }

  const { whiteInCheck, blackInCheck } = getCheckState(chess);
  if (whiteInCheck && blackInCheck) {
    violations.add("simultaneous-check");
  } else if (
    (whiteInCheck && chess.turn() !== "w") ||
    (blackInCheck && chess.turn() !== "b")
  ) {
    violations.add("checked-side-not-to-move");
  }

  return {
    valid: violations.size === 0,
    violations: [...violations],
    whiteInCheck,
    blackInCheck,
  };
}

function legalSquaresForPiece(
  emptySquares: readonly Square[],
  pieceType: Exclude<PieceSymbol, "k">,
  bishopComplex?: 0 | 1,
): Square[] {
  return emptySquares.filter((square) => {
    if (pieceType === "p" && (square[1] === "1" || square[1] === "8")) {
      return false;
    }

    if (
      pieceType === "b" &&
      bishopComplex !== undefined &&
      squareColorComplex(square) === bishopComplex
    ) {
      return false;
    }

    return true;
  });
}

function finalizePosition(chess: Chess, pieceCount: number): Chess | null {
  const { whiteInCheck, blackInCheck } = getCheckState(chess);
  if (whiteInCheck && blackInCheck) return null;

  const activeColor: Color = blackInCheck ? "b" : "w";
  const boardFen = chess.fen().split(" ")[0];

  try {
    const finalized = new Chess(`${boardFen} ${activeColor} - - 0 1`);
    return validateMemorizationPosition(finalized, pieceCount).valid
      ? finalized
      : null;
  } catch {
    return null;
  }
}

function generateCandidate(
  pieceCount: number,
  random: RandomSource,
): Chess | null {
  const chess = new Chess();
  chess.clear();

  const whiteKing = chooseRandom(SQUARES, random);
  if (!whiteKing) return null;

  const blackKing = chooseRandom(
    SQUARES.filter(
      (square) =>
        square !== whiteKing && !areSquaresAdjacent(square, whiteKing),
    ),
    random,
  );
  if (!blackKing) return null;

  chess.put({ type: "k", color: "w" }, whiteKing);
  chess.put({ type: "k", color: "b" }, blackKing);

  const remainingByColor: Record<Color, number> = {
    w: Math.ceil((pieceCount - 2) / 2),
    b: Math.floor((pieceCount - 2) / 2),
  };
  const inventory: Record<Color, Record<Exclude<PieceSymbol, "k">, number>> = {
    w: { ...PIECE_WEIGHTS },
    b: { ...PIECE_WEIGHTS },
  };
  const bishopComplex: Partial<Record<Color, 0 | 1>> = {};
  let piecesPlaced = 2;

  while (piecesPlaced < pieceCount) {
    const emptySquares = SQUARES.filter((square) => !chess.get(square));
    const eligibleColors = COLORS.filter(
      (color) => remainingByColor[color] > 0,
    );
    const color = chooseRandom(eligibleColors, random);
    if (!color) return null;

    const weightedTypes = (
      Object.keys(PIECE_WEIGHTS) as Array<Exclude<PieceSymbol, "k">>
    ).reduce<Array<Exclude<PieceSymbol, "k">>>((types, pieceType) => {
      if (inventory[color][pieceType] <= 0) return types;
      if (
        legalSquaresForPiece(emptySquares, pieceType, bishopComplex[color])
          .length === 0
      ) {
        return types;
      }
      types.push(...Array(PIECE_WEIGHTS[pieceType]).fill(pieceType));
      return types;
    }, []);
    const pieceType = chooseRandom(weightedTypes, random);
    if (!pieceType) return null;

    const square = chooseRandom(
      legalSquaresForPiece(emptySquares, pieceType, bishopComplex[color]),
      random,
    );
    if (!square) return null;

    if (!chess.put({ type: pieceType, color }, square)) return null;

    if (pieceType === "b" && bishopComplex[color] === undefined) {
      bishopComplex[color] = squareColorComplex(square);
    }
    inventory[color][pieceType] -= 1;
    remainingByColor[color] -= 1;
    piecesPlaced += 1;
  }

  return finalizePosition(chess, pieceCount);
}

function createFallbackPosition(pieceCount: number): Chess | null {
  const chess = new Chess();
  chess.clear();

  FALLBACK_POSITION.slice(0, pieceCount).forEach(({ square, type, color }) => {
    chess.put({ type, color }, square);
  });

  return finalizePosition(chess, pieceCount);
}

export function generateMemorizationPosition(
  requestedPieceCount: number,
  random: RandomSource = Math.random,
): Chess | null {
  const pieceCount = Math.max(
    PIECE_COUNT_RANGE.min,
    Math.min(PIECE_COUNT_RANGE.max, requestedPieceCount),
  );

  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt += 1) {
    const position = generateCandidate(pieceCount, random);
    if (position) return position;
  }

  return createFallbackPosition(pieceCount);
}
