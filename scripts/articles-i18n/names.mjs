export const ENGLISH = "en";

export const ARTICLE = "article";

/** A trust page or its reading chrome: prose of ICU messages, kept in its own file like an article. */
export const PAGE = "page";

/** Whether the leaves of a kind are ICU messages, whose syntax a reader never sees. */
export const isIcuKind = (kind) => kind !== ARTICLE;

/** What the page chrome of a locale is called: its file, its key in same-as-english.json, its failure lines. */
export const CHROME = "chrome";
