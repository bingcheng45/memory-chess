import { Literata } from "next/font/google";
import type { Locale } from "@/i18n/routing";

// Declared here and not in src/lib/fonts.ts. The root layout imports that
// module, and next/font ships every face in a layout's module graph to every
// route. Only the article page imports this one.
//
// One instance serves every locale that reads in Literata. next/font emits a
// face for each subset the family has, each with its own unicode-range, so a
// browser fetches the Cyrillic, Vietnamese or Latin Extended file when the
// text needs it. `subsets` only picks what is preloaded, and a preload applies
// to the route in every locale.
const literata = Literata({ subsets: ["latin"], weight: ["400", "600"], display: "swap" });

const SITE_SANS = "[font-family:var(--font-geist-sans)]";

// Literata has no Devanagari, Japanese, Korean or Chinese glyphs. These
// locales read in the sans stack src/lib/fonts.ts already gives them.
const READING_FACE: ReadonlyMap<string, string> = new Map<Locale, string>([
  ["hi", SITE_SANS],
  ["ja", SITE_SANS],
  ["ko", SITE_SANS],
  ["zh-CN", SITE_SANS],
  ["zh-TW", SITE_SANS],
]);

export function readingFaceClass(locale: string): string {
  return READING_FACE.get(locale) ?? literata.className;
}
