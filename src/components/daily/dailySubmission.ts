import { dailySettingOf } from "@/lib/daily/schedule";
import type { DailyRound } from "@/lib/lab/daily";
import type { CountryCode } from "@/lib/leaderboard/countries";
import { DAILY_BOARD, type LeaderboardSubmission } from "@/types/leaderboard";

/** Pieces and study seconds are the day's setting, not the seconds actually studied: a player who ends the study early still played that day's board. */
export function dailySubmission(round: DailyRound, playerName: string, country: CountryCode, skillRating: number): LeaderboardSubmission {
  const setting = dailySettingOf(round.dailyDay);
  return {
    player_name: playerName,
    country_code: country,
    difficulty: DAILY_BOARD,
    daily_day: round.dailyDay,
    piece_count: setting.pieceCount,
    correct_pieces: round.correct,
    memorize_time: setting.memorizeTime,
    solution_time: round.solveMs / 1000,
    total_wrong_pieces: round.wrong,
    skill_rating: skillRating,
  };
}
