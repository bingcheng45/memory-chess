import type { ReadingChrome } from "./schema";

/** The English strings a reading page draws around its text. Pages that are never translated use these as they are. */
const readingChrome: ReadingChrome = {
  contents: "Contents",
  onThisPage: "On this page",
  lastUpdated: "Last updated: <time>{date}</time>",
};

export default readingChrome;
