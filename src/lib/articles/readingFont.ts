import { Literata } from "next/font/google";

// Declared here and not in src/lib/fonts.ts. The root layout imports that
// module, and next/font ships every face in a layout's module graph to every
// route. Only the article page imports this one.
//
// next/font emits a face for each subset the family has, each with its own
// unicode-range, so the browser fetches the Cyrillic or Vietnamese file only
// when the text needs it. `subsets` only picks what is preloaded.
const literata = Literata({ subsets: ["latin"], weight: ["400", "600"], display: "swap" });

const SITE_SANS = "[font-family:var(--font-geist-sans)]";

// Literata draws Latin (with Latin Extended and Vietnamese) and Cyrillic and nothing else.
const LITERATA_SCRIPTS: ReadonlySet<string> = new Set(["Latn", "Cyrl"]);

function scriptOf(locale: string): string | undefined {
  try {
    return new Intl.Locale(locale).maximize().script;
  } catch {
    // Intl.Locale throws on a string that is not a locale tag.
    return undefined;
  }
}

export function readingFaceClass(locale: string): string {
  const script = scriptOf(locale);
  return script === undefined || LITERATA_SCRIPTS.has(script) ? literata.className : SITE_SANS;
}
