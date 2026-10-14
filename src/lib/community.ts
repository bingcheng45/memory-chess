export const COMMUNITY_URL = "https://t.me/TheMemoryChess";

export const COMMUNITY_PLACEMENTS = ["result", "daily", "dashboard", "leaderboard", "footer", "about"] as const;

/** Where the link sits. It becomes the element id, which GA4's outbound-click measurement reports as `link_id`. */
export type CommunityPlacement = (typeof COMMUNITY_PLACEMENTS)[number];

/** Rounds a player has finished before the invite appears on the result and dashboard screens; a first-timer is never asked. */
export const COMMUNITY_MIN_ROUNDS = 3;

export const isReturningPlayer = (finishedRounds: number): boolean => finishedRounds >= COMMUNITY_MIN_ROUNDS;
