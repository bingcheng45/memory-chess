export const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
export const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"] as const;

export type SquareName = `${(typeof FILES)[number]}${(typeof RANKS)[number]}`;

export const BOARD_SQUARES: readonly SquareName[] = RANKS.flatMap((rank) =>
  FILES.map((file): SquareName => `${file}${rank}`),
);
