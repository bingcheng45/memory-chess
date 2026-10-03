import { Literata } from "next/font/google";

// Declared here and not in src/lib/fonts.ts. The root layout imports that
// module, and next/font ships every face in a layout's module graph to every
// route. Only the article page imports this one.
export const readingFont = Literata({ subsets: ["latin"], weight: ["400", "600"], display: "swap" });
