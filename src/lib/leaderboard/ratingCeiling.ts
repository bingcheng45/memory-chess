/**
 * The highest skill rating a client can send. The rating is a running value kept in the player's browser, so the server
 * cannot recompute it from one round. The engine settles at about 3190 after perfect, fastest-possible rounds on the
 * largest board, and stops paying a board that sits 500 below the rating, so 3700 is out of reach of any honest player.
 */
export const SUBMITTABLE_RATING_CEILING = 3700;
