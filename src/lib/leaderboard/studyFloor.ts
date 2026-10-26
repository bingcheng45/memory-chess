import { GAME_CONFIG_RULES } from '@/lib/game/configPrefill';
import type { LeaderboardDifficulty } from '@/types/leaderboard';

const MIN_STUDY_SECONDS = 0.3;
const STUDY_SECONDS_PER_PIECE = 0.1;

export const BOARD_PIECES = Object.fromEntries(GAME_CONFIG_RULES.presets.map(({ id, pieceCount }) => [id, pieceCount])) as Record<LeaderboardDifficulty, number>;

/**
 * The least study time a ranked row may record. Counted in thousandths so 6 pieces floor at exactly 0.6, which
 * pieces * 0.1 does not (0.6000000000000001) and the column's three decimals could never store.
 */
export function studyFloorSeconds(pieceCount: number): number {
  return Math.max(MIN_STUDY_SECONDS, Math.round(pieceCount * STUDY_SECONDS_PER_PIECE * 1000) / 1000);
}
