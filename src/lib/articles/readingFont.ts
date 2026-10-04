import { Literata } from "next/font/google";

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

// Literata draws Latin (with Latin Extended and Vietnamese) and Cyrillic and
// nothing else. A locale reads in it when its script is one of these, and in
// the sans stack src/lib/fonts.ts already gives the other scripts otherwise.
// A locale added later needs no entry here.
const LITERATA_SCRIPTS: ReadonlySet<string> = new Set(["Latn", "Cyrl"]);

function scriptOf(locale: string): string | undefined {
  try {
    return new Intl.Locale(locale).maximize().script;
  } catch {
    // Not a locale tag. The caller reads it in Literata, as it does any locale with no known script.
    return undefined;
  }
}

export function readingFaceClass(locale: string): string {
  const script = scriptOf(locale);
  return script === undefined || LITERATA_SCRIPTS.has(script) ? literata.className : SITE_SANS;
}
