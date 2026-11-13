import { INTRO_SEEN_KEY } from "@/lib/lab/storage";

/**
 * Who skips the 45-board intro, in order: the first signal that is true stops it, and anyone with none sees it.
 * Search visitors and crawlers are not here on purpose (docs/plans/forty-five-intro.md).
 */
export const INTRO_RULES = ["reducedMotion", "saveData", "seen", "deepLink", "firstScreen"] as const;

/**
 * Where the phone first screen (IntroFirstScreen) tells the story in place of the intro: these locales, below this
 * width. The width matches the media query in intro.css. Its "Read Najdorf's story" button still plays the intro.
 */
export const FIRST_SCREEN_LOCALES: readonly string[] = ["en"];
export const FIRST_SCREEN_MEDIA = "(max-width: 767px)";

export type IntroSignal = (typeof INTRO_RULES)[number];
export type IntroSignals = Readonly<Record<IntroSignal, boolean>>;

/**
 * The intro ships only behind this build flag; with it off, the home page gains nothing. Unset, it is on in a
 * production build and off in dev and tests; "0" turns it off and "1" on anywhere.
 */
export const HOME_INTRO = (process.env.NEXT_PUBLIC_HOME_INTRO || (process.env.NODE_ENV === "production" ? "1" : "0")) === "1";

/** The window event the hero's replay link sends to play the intro again. */
export const INTRO_REPLAY_EVENT = "home-intro:replay";

/** The attribute the gate puts on its own script element; the shell shows only behind it. */
export const INTRO_MARK = "data-home-intro";

/** The rule that stops the intro, or null when it plays. */
export function decideIntro(signals: IntroSignals): IntroSignal | null {
  return INTRO_RULES.find((signal) => signals[signal]) ?? null;
}

/**
 * Runs while the page is parsed, before the shell paints. It reads the signals, applies INTRO_RULES, and when the
 * intro plays it records the seen flag and marks itself. It marks the script rather than <html>, which React hydrates.
 */
export const INTRO_GATE = `try{var s={reducedMotion:matchMedia("(prefers-reduced-motion: reduce)").matches,saveData:!!(navigator.connection&&navigator.connection.saveData),seen:localStorage.getItem(${JSON.stringify(INTRO_SEEN_KEY)})!==null,deepLink:location.hash.length>1,firstScreen:${JSON.stringify(FIRST_SCREEN_LOCALES)}.indexOf(document.documentElement.lang)>-1&&matchMedia(${JSON.stringify(FIRST_SCREEN_MEDIA)}).matches};if(!${JSON.stringify(INTRO_RULES)}.some(function(r){return s[r]})){localStorage.setItem(${JSON.stringify(INTRO_SEEN_KEY)},"1");document.currentScript.setAttribute(${JSON.stringify(INTRO_MARK)},"")}}catch(e){}`;
