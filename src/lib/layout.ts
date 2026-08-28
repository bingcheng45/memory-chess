/**
 * Layout figures that more than one screen depends on.
 *
 * A number that two files both need is a number they can disagree about. The
 * ones here were each written out by hand in three or four places, and the
 * copies drifted: the board's ceiling and the width of the headers meant to
 * match it were the same figure maintained separately, and the page height
 * repeated an assumption about the banner above it that nothing checked.
 *
 * Figures used in only one place are better left where they are read. This is
 * for the ones that travel.
 */

/**
 * The largest the board is allowed to grow. Past this it stops and centres in
 * whatever space it has, so a wide desktop does not hand it the whole screen.
 *
 * Headers on the game and leaderboard screens are held to the same figure so
 * they line up with the board rather than running wider than it.
 */
export const MAX_BOARD_SIZE = 600;

/** As a CSS length, for inline styles that size a header to the board. */
export const MAX_BOARD_SIZE_PX = `${MAX_BOARD_SIZE}px`;

/**
 * Height of the changelog banner pinned above every page, plus its bottom
 * border. A page that should fill the screen has to leave room for it.
 *
 * This is an assumption about another component, and a fragile one -- it is
 * wrong the moment the banner wraps to a second line, which it does on a
 * narrow screen. The active game phases no longer rely on it, taking their
 * height from a flex column instead; it remains only for the ordinary
 * scrolling pages, where being a little short is invisible.
 *
 * Written out in full because Tailwind's scanner matches on the literal text
 * of a class name and cannot follow an interpolation.
 */
export const PAGE_BELOW_BANNER_MIN_HEIGHT = 'min-h-[calc(100dvh-2.5rem-1px)]';

/**
 * The smallest board worth playing on, in pixels -- a 30px square, about the
 * width of a fingertip.
 *
 * The active phases size the board from the room left over, which is right
 * until there is no room. A short viewport -- a phone held in landscape, a
 * desktop window dragged flat -- can leave the two fixed rows consuming the
 * whole screen, and the board is handed what remains: at 844x390 that was
 * around 15px, with the timer and palette narrowed to match it.
 *
 * This is the floor the layout refuses to go under. Below it the column keeps
 * its height and the page scrolls instead, which is worse than fitting but
 * far better than a board nobody can see.
 */
export const MIN_BOARD_SIZE = 240;
