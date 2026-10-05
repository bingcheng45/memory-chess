import { textOf } from "./icu.mjs";
import { LANGUAGE_LIMITS, englishLead, wordsOf } from "./language.mjs";
import { ARTICLE, ENGLISH } from "./names.mjs";
import { MAY_EQUAL_ENGLISH, wordsThatMayStay } from "./paths.mjs";

const COPY_SHARE = 0.8;
// One word that a translation shares with its English leaf can be a name or chance. Two in a row were kept.
const MIN_KEPT_RUN = 2;
const WHAT_TO_DO =
  "Translate it, or keep in English only what the English text has word for word inside a sentence that is otherwise translated, such as a title";

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

function longestSharedRun(words, start, source) {
  return source.reduce(
    (longest, _, sourceStart) => {
      let length = 0;
      while (start + length < words.length && words[start + length] === source[sourceStart + length]) length += 1;
      return length > longest.length ? { length, sourceStart } : longest;
    },
    { length: 0, sourceStart: 0 },
  );
}

/** The index in `source` of each of `words` that is in a run both have, and `undefined` for any other word. */
function keptSourceIndexes(words, source) {
  const indexes = words.map(() => undefined);
  let at = 0;
  while (at < words.length) {
    const { length, sourceStart } = longestSharedRun(words, at, source);
    const kept = length >= MIN_KEPT_RUN ? length : 0;
    for (let step = 0; step < kept; step += 1) indexes[at + step] = sourceStart + step;
    at += Math.max(kept, 1);
  }
  return indexes;
}

/**
 * A run of words that the English leaf has word for word is a title or a
 * saying kept on purpose, and does not count toward English. A leaf that keeps
 * four in five of the words of an English sentence left that sentence
 * untranslated, and all of it counts.
 */
function sentencesRead({ kind, locale, english, value }) {
  const source = sentencesOf(textOf(kind, english, ENGLISH), ENGLISH).map(wordsOf);
  const sourceWords = source.flat();
  const sentenceOf = source.flatMap((words, sentence) => words.map(() => sentence));
  const sentences = sentencesOf(textOf(kind, value, locale), locale).map((text) => {
    const words = wordsOf(text);
    return { text, words, kept: keptSourceIndexes(words, sourceWords) };
  });
  const keptInTheLeaf = new Set(sentences.flatMap(({ kept }) => kept));
  const keptOf = (sentence) => sentenceOf.filter((at, index) => at === sentence && keptInTheLeaf.has(index)).length;
  const wasLeftInEnglish = source.map((words, sentence) => keptOf(sentence) >= words.length * COPY_SHARE);
  const countsTowardEnglish = (sourceIndex) => sourceIndex === undefined || wasLeftInEnglish[sentenceOf[sourceIndex]];

  return sentences.map(({ text, words, kept }) => ({
    text,
    words,
    counted: words.filter((_, index) => countsTowardEnglish(kept[index])),
  }));
}

/**
 * Fails a leaf with a sentence of English in it, whether or not it is the
 * English of its path: a paragraph left half translated reads as its locale
 * as a whole. A leaf of short English sentences fails as a whole.
 */
export function englishProseProblems(leaf) {
  const { kind, path, locale } = leaf;
  if (kind === ARTICLE && MAY_EQUAL_ENGLISH.test(path)) return [];
  const { maxLead } = LANGUAGE_LIMITS;
  const leadOf = ({ words, counted }) => englishLead(locale, words, counted);
  const sentences = sentencesRead(leaf);
  const failing = sentences.filter((sentence) => leadOf(sentence) > maxLead);

  if (failing.length > 0) {
    return [
      `not in ${locale}: English function words outnumber ${locale} ones by more than ${maxLead} in ${failing.length} of ${sentences.length} sentences, the first: "${failing[0].text}". ${WHAT_TO_DO}`,
    ];
  }
  const lead = leadOf({ words: sentences.flatMap(({ words }) => words), counted: sentences.flatMap(({ counted }) => counted) });
  if (lead <= maxLead) return [];
  return [`not in ${locale} as a whole: ${lead} more English function words than ${locale} ones. ${WHAT_TO_DO}`];
}
