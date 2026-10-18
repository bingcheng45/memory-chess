import { PIECE_COUNT_RANGE } from "@/lib/reference/facts";

export interface BoardSize {
  readonly pieceCount: number;
  readonly memorizeSeconds: number;
}

const MORE_AT = 90;
const FEWER_BELOW = 50;
const FEWER_MIN_PIECES = 3;

export function nextBoardOf({ pieceCount, memorizeSeconds }: BoardSize, accuracy: number): BoardSize {
  if (accuracy >= MORE_AT && pieceCount < PIECE_COUNT_RANGE.max) return { pieceCount: pieceCount + 1, memorizeSeconds };
  if (accuracy < FEWER_BELOW && pieceCount > FEWER_MIN_PIECES) return { pieceCount: pieceCount - 1, memorizeSeconds };
  return { pieceCount, memorizeSeconds };
}
