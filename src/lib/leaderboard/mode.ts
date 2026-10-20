/**
 * True once migration 0008 has added leaderboard_entries.mode and the deploy sets NEXT_PUBLIC_BLINDFOLD_LEADERBOARD=1.
 * Until then nothing reads or writes the column: board boards are read as before and blindfold scores are not taken.
 */
export const blindfoldBoardOpen = (): boolean => process.env.NEXT_PUBLIC_BLINDFOLD_LEADERBOARD === "1";
