export const START_RATING = 1000;

export const MAX_SKILL_RATING = 5000;

export const isSkillRating = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0;
