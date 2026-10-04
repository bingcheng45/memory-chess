import { textOf } from "./icu.mjs";
import { ARTICLE } from "./names.mjs";
import { MAY_EQUAL_ENGLISH, wordsThatMayStay } from "./paths.mjs";

const WORD = /[\p{L}\p{M}]+/gu;
const COPY_SHARE = 0.8;

// Words of English that no other shipped language uses. `in`, `of`, `was`,
// `her`, `is`, `on`, `to`, `for` and their like are left out because Dutch,
// German, the Nordic languages, Czech, Polish, French or Portuguese have them
// too, and so are `had` (Dutch), `have` (Danish) and `not` (Turkish).
const ENGLISH_ONLY_WORDS = new Set(
  (
    "the and that with which from this were they their would about when what there been who has " +
    "she his him them than these those its into after could did does between while where because"
  ).split(" "),
);
const MAX_ENGLISH_ONLY_WORDS = 3;
// A long translated paragraph may quote several English titles.
const ENGLISH_PROSE_SHARE = 0.1;

const wordsOf = (text) => text.toLowerCase().match(WORD) ?? [];

const timesIn = (words, word) => words.filter((other) => other === word).length;

function keptCount(english, translated) {
  return [...new Set(english)].reduce(
    (sum, word) => sum + Math.min(timesIn(english, word), timesIn(translated, word)),
    0,
  );
}

/** Fails an article leaf that keeps four in five of the words of its English leaf. */
export function copyProblems({ kind, path, english, value }) {
  if (kind !== ARTICLE || value === english || MAY_EQUAL_ENGLISH.test(path)) return [];
  const source = wordsOf(english);
  if (source.length <= wordsThatMayStay(path)) return [];
  const kept = keptCount(source, wordsOf(value));
  if (kept / source.length < COPY_SHARE) return [];
  return [`${kept} of ${source.length} English words are still here, the text looks untranslated`];
}

/** Fails a leaf that is English prose, whether or not it is the English leaf of its path. */
export function englishProseProblems({ kind, path, locale, value }) {
  if (kind === ARTICLE && MAY_EQUAL_ENGLISH.test(path)) return [];
  const words = wordsOf(textOf(kind, value, locale));
  const english = words.filter((word) => ENGLISH_ONLY_WORDS.has(word));
  if (english.length <= MAX_ENGLISH_ONLY_WORDS || english.length / words.length < ENGLISH_PROSE_SHARE) return [];
  const named = [...new Set(english)].join(", ");
  return [`${english.length} of ${words.length} words are English (${named}), the text looks untranslated`];
}
