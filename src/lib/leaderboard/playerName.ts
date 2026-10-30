import { isBlockedName } from '@/lib/leaderboard/blockedNames';

const PLAYER_NAME_LENGTH = { min: 4, max: 16 } as const;

/** Counts code points, as the database's LENGTH check does, so an emoji is one character. */
export function playerNameProblem(name: string): 'short' | 'long' | 'blocked' | null {
  const length = [...name].length;
  if (length < PLAYER_NAME_LENGTH.min) return 'short';
  if (length > PLAYER_NAME_LENGTH.max) return 'long';
  return isBlockedName(name) ? 'blocked' : null;
}
