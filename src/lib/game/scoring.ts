/** Square name ("e4") to FEN piece letter ("N" is a white knight, "n" a black one). */
export type Placement = Readonly<Record<string, string>>;

export interface PlacementScore {
  readonly accuracy: number;
  readonly correct: number;
  readonly total: number;
  /** Pieces placed beyond the target's piece count. */
  readonly extra: number;
  /** Target pieces not recalled on their square with the right colour and type. */
  readonly missed: number;
  readonly totalWrong: number;
}

const EXTRA_PIECE_PENALTY = 10;
const FILES = "abcdefgh";

export function placementFromFen(fen: string): Placement {
  const ranks = fen.split(" ")[0].split("/");
  return Object.fromEntries(
    ranks.flatMap((row, rowIndex) => {
      let file = 0;
      return [...row].flatMap((char) => {
        const skip = Number(char);
        if (skip > 0) {
          file += skip;
          return [];
        }
        const square = `${FILES[file]}${8 - rowIndex}`;
        file += 1;
        return [[square, char] as const];
      });
    }),
  );
}

export function countWrong({ total, correct, extra }: { total: number; correct: number; extra: number }): number {
  return total - correct + extra;
}

export function scorePlacement(target: Placement, placed: Placement): PlacementScore {
  const targetSquares = Object.keys(target);
  const total = targetSquares.length;
  const correct = targetSquares.filter((square) => placed[square] === target[square]).length;
  const extra = Math.max(0, Object.keys(placed).length - total);
  const base = total === 0 ? 0 : Math.round((correct / total) * 100);

  return {
    accuracy: Math.max(0, base - extra * EXTRA_PIECE_PENALTY),
    correct,
    total,
    extra,
    missed: total - correct,
    totalWrong: countWrong({ total, correct, extra }),
  };
}
