/** Every player's rating before their first rated round, and what a leaderboard row stored without one reads. */
export const START_RATING = 1000;

/** The highest rating the leaderboard stores; the table's check holds the same bound. */
export const MAX_SKILL_RATING = 5000;

/** A rating as the store and the leaderboard keep it: a whole number from 0 up. */
export const isSkillRating = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0;
