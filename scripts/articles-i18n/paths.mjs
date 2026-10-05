/** Article paths the page prints as they are in English: a name, a credit, a licence, a source title. */
export const MAY_EQUAL_ENGLISH = /^(person\.name|photo\.author|photo\.license|sources\[\d+\]\.title)$/;

/** The running text of an article. A reader reads it as prose, so it is never right in English. */
export const BODY_PATH = /^(description|drill\.why|sections\[\d+\]\.(heading|paragraphs\[\d+\])|sources\[\d+\]\.note)$/;

export const TITLE_PATH = "title";

export const MAX_WORDS_THAT_MAY_STAY = 3;
// A fact, a role or a caption of up to five words can be a name or a title,
// such as "Thought and Choice in Chess (1965)".
const MAX_WORDS_OF_A_NAME = 5;

/** How many words an English leaf at `path` may have before a translation that keeps them is a copy. */
export const wordsThatMayStay = (path) =>
  path === TITLE_PATH || BODY_PATH.test(path) ? MAX_WORDS_THAT_MAY_STAY : MAX_WORDS_OF_A_NAME;
