import { Open_Sans } from "next/font/google";
import "./lab-paper.css";

/**
 * Lab Paper's body face. The locale layout's banner and footer import this module on every route, so the face is
 * not preloaded: it downloads only on a page that sets text in it, as it did when only the homepage declared it.
 * Each subset is a unicode-range, fetched only when a page draws one of its glyphs. Scripts Open Sans lacks
 * (CJK, Devanagari) fall through to the locale's own face in --lp-body.
 */
const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin", "latin-ext", "cyrillic", "vietnamese"],
  display: "swap",
  preload: false,
});

/** The class every block drawn in Lab Paper carries: the tokens, the page base and the body face. */
export const LAB_PAPER_CLASS = `lab-paper ${openSans.variable}`;
