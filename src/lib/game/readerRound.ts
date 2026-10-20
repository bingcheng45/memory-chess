import type { GameSettings } from "@/lib/game/configPrefill";
import { isSkillRating, MAX_SKILL_RATING, parseCertainty, suggestBoard, type PlayerRating } from "@/lib/game/rating";
import { MEMORIZE_SECONDS_RANGE, PIECE_COUNT_RANGE } from "@/lib/reference/facts";

export const BEGINNER_ROUND: GameSettings = { pieceCount: 4, memorizeTime: 10 };

const RANGES = { pieces: PIECE_COUNT_RANGE, seconds: MEMORIZE_SECONDS_RANGE };

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

function playerOf(stored: string | null): PlayerRating | null {
  try {
    const parsed: unknown = JSON.parse(stored ?? "null");
    const state = isRecord(parsed) && isRecord(parsed.state) ? parsed.state : null;
    const rating = state && isRecord(state.gameState) ? state.gameState.skillRating : undefined;
    const certainty = parseCertainty(state?.certainty);
    return isSkillRating(rating) && certainty.rounds > 0 ? { rating: Math.min(rating, MAX_SKILL_RATING), ...certainty } : null;
  } catch {
    return null;
  }
}

export const newReaderRound = (page: GameSettings & { readonly blindfold?: true }): GameSettings =>
  !page.blindfold && page.pieceCount <= 6 && page.memorizeTime >= 10 ? page : BEGINNER_ROUND;

export function readerRoundOf(stored: string | null, unrated: GameSettings = BEGINNER_ROUND): GameSettings {
  const player = playerOf(stored);
  if (!player) return unrated;
  const { pieceCount, studySeconds } = suggestBoard(player, RANGES);
  return { pieceCount, memorizeTime: studySeconds };
}
