import type { ReadingChrome } from "./schema";

/** The English strings a reading page draws around its text. Pages that are never translated use these as they are. */
const readingChrome: ReadingChrome = {
  contents: "Contents",
  onThisPage: "On this page",
  lastUpdated: "Last updated: <time>{date}</time>",
  note: {
    general: "This page was translated from English with AI assistance. The English page is the reference.",
    legal:
      "This translation was made with AI assistance and is provided for convenience. If it differs from the English version, the English version governs.",
    readInEnglish: "Read it in English",
  },
};

export default readingChrome;
