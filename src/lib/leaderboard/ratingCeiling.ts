/**
 * The highest skill rating a client can send. The rating is a running value kept in the player's browser, so the server
 * cannot recompute it from one round. Perfect, fastest-possible rounds reach about 3370 on 32 pieces studied for a second,
 * and a sequence of boards picked to climb fastest about 3520, so 3700 is out of reach of any legitimate player.
 */
export const SUBMITTABLE_RATING_CEILING = 3700;
