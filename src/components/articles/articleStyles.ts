export const ARTICLE_FOCUS_RING =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peach-300";

// A translated word can be longer than a narrow column: German "Gedächtnisleistung" is wider than the
// fact file's label column. Such a word breaks, and outside English it breaks at a hyphenation point.
// English is left alone because its line breaks were fitted by hand.
export const ARTICLE_LONG_WORDS = "[overflow-wrap:anywhere] [&:not(:lang(en))]:hyphens-auto";

/** A link in the articles' Lab Paper pages: colours from articlePaper.css, the 150ms colour transition kept. */
export const ARTICLE_LINK = "art-link transition-colors motion-reduce:transition-none";
