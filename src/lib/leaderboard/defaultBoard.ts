import type { RankedDifficulty } from '@/lib/reference/facts';

/** The board the leaderboard opens on, and the only one its served page carries. Outside the client tabs so the server page can read it. */
export const DEFAULT_BOARD: RankedDifficulty = 'medium';
