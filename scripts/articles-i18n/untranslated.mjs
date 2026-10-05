import { textOf } from "./icu.mjs";
import { LANGUAGE_LIMITS, englishLeadIn, wordsOf } from "./language.mjs";
import { ARTICLE } from "./names.mjs";
import { MAY_EQUAL_ENGLISH, wordsThatMayStay } from "./paths.mjs";

const COPY_SHARE = 0.8;

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

function sentencesOf(text, locale) {
  const segments = new Intl.Segmenter(locale, { granularity: "sentence" }).segment(text);
  return [...segments].map(({ segment }) => segment.trim()).filter((sentence) => sentence !== "");
}

/**
 * Fails a leaf with a sentence of English in it, whether or not it is the
 * English of its path: a paragraph left half translated reads as its locale
 * as a whole. A leaf of short English sentences fails as a whole.
 */
export function englishProseProblems({ kind, path, locale, value }) {
  if (kind === ARTICLE && MAY_EQUAL_ENGLISH.test(path)) return [];
  const text = textOf(kind, value, locale);
  const isEnglish = (part) => englishLeadIn(locale, part) > LANGUAGE_LIMITS.maxLead;
  const sentences = sentencesOf(text, locale);
  const english = sentences.filter(isEnglish);

  if (english.length > 0) return [`${english.length} of ${sentences.length} sentences read as English, the first: "${english[0]}"`];
  if (!isEnglish(text)) return [];
  return [`reads as English as a whole: ${englishLeadIn(locale, text)} more English function words than ${locale} ones`];
}
