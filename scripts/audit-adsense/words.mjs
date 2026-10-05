export const SPACED_COUNTER = "space-separated words";
export const SEGMENTED_COUNTER = "Intl.Segmenter word segments";

/** Written without spaces, so splitting on spaces reads a whole sentence as one word. */
const UNSPACED_LOCALES = new Set(["ja", "zh-CN", "zh-TW"]);

export function countWords(text) {
  return text ? text.split(" ").filter((w) => /[\p{L}\p{N}]/u.test(w)).length : 0;
}

function countSegments(text, locale) {
  const segments = new Intl.Segmenter(locale, { granularity: "word" }).segment(text);
  return [...segments].filter((segment) => segment.isWordLike).length;
}

/** The words of a page served in `locale`, and the name of the counter that read them. */
export function countLocaleWords(text, locale) {
  return UNSPACED_LOCALES.has(locale)
    ? { words: countSegments(text, locale), counter: SEGMENTED_COUNTER }
    : { words: countWords(text), counter: SPACED_COUNTER };
}
