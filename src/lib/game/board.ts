export const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
/** Top to bottom, as the board is drawn with white at the bottom. */
export const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"] as const;

export type SquareName = `${(typeof FILES)[number]}${(typeof RANKS)[number]}`;

/** Board squares in reading order: a8 at index 0, h1 at index 63. */
export const BOARD_SQUARES: readonly SquareName[] = RANKS.flatMap((rank) =>
  FILES.map((file): SquareName => `${file}${rank}`),
);
