import { textOf } from "./icu.mjs";
import { LANGUAGE_LIMITS, englishLead, wordsOf } from "./language.mjs";
import { ARTICLE, ENGLISH } from "./names.mjs";
import { MAY_EQUAL_ENGLISH, wordsThatMayStay } from "./paths.mjs";

/** A text that keeps this share of the words of its English text was left in English: a leaf, or one sentence of it. */
const COPY_SHARE = 0.8;
/** One word that a translation shares with its English leaf can be a name or a chance. Two in a row were kept. */
const MIN_KEPT_RUN = 2;
const NOT_KEPT = -1;
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

/** The longest run of `source` that `words` has from `start` on, and where `source` has it. */
function longestRun(words, start, source) {
  return source.reduce(
    (longest, _, from) => {
      let length = 0;
      while (start + length < words.length && words[start + length] === source[from + length]) length += 1;
      return length > longest.length ? { length, from } : longest;
    },
    { length: 0, from: 0 },
  );
}

/** For each of `words`, its place in `source` when both have it inside the same run of words, and `NOT_KEPT` when not. */
function keptPlaces(words, source) {
  const places = words.map(() => NOT_KEPT);
  let at = 0;
  while (at < words.length) {
    const { length, from } = longestRun(words, at, source);
    const kept = length >= MIN_KEPT_RUN ? length : 0;
    for (let step = 0; step < kept; step += 1) places[at + step] = from + step;
    at += Math.max(kept, 1);
  }
  return places;
}

/**
 * The sentences of a translated leaf, each with its words and the ones among
 * them that count toward English. A run of words that the English leaf has
 * word for word is a title or a saying kept on purpose and does not count.
 * That holds unless the leaf keeps four in five of the words of the English
 * sentence the run is from: that sentence was left untranslated, and all of
 * it counts.
 */
function sentencesRead({ kind, locale, english, value }) {
  const source = sentencesOf(textOf(kind, english, ENGLISH), ENGLISH).map(wordsOf);
  const sourceWords = source.flat();
  const sentenceAt = source.flatMap((words, sentence) => words.map(() => sentence));
  const sentences = sentencesOf(textOf(kind, value, locale), locale).map((text) => {
    const words = wordsOf(text);
    return { text, words, places: keptPlaces(words, sourceWords) };
  });
  const keptPerSentence = [...new Set(sentences.flatMap(({ places }) => places))]
    .filter((place) => place !== NOT_KEPT)
    .reduce((kept, place) => kept.with(sentenceAt[place], kept[sentenceAt[place]] + 1), source.map(() => 0));
  const isLeftInEnglish = (place) => keptPerSentence[sentenceAt[place]] >= source[sentenceAt[place]].length * COPY_SHARE;

  return sentences.map(({ text, words, places }) => ({
    text,
    words,
    counted: words.filter((_, index) => places[index] === NOT_KEPT || isLeftInEnglish(places[index])),
  }));
}

/**
 * Fails a leaf with a sentence of English in it, whether or not it is the
 * English of its path: a paragraph left half translated reads as its locale
 * as a whole. A leaf of short English sentences fails as a whole. The text
 * can be in a third language that shares function words with English, so the
 * failure says the text is not in its locale and does not name a language.
 */
export function englishProseProblems(leaf) {
  const { kind, path, locale } = leaf;
  if (kind === ARTICLE && MAY_EQUAL_ENGLISH.test(path)) return [];
  const { maxLead } = LANGUAGE_LIMITS;
  const leadOf = ({ words, counted }) => englishLead(locale, words, counted);
  const sentences = sentencesRead(leaf);
  const english = sentences.filter((sentence) => leadOf(sentence) > maxLead);

  if (english.length > 0) {
    return [
      `not in ${locale}: English function words outnumber ${locale} ones by more than ${maxLead} in ${english.length} of ${sentences.length} sentences, the first: "${english[0].text}". ${WHAT_TO_DO}`,
    ];
  }
  const lead = leadOf({ words: sentences.flatMap(({ words }) => words), counted: sentences.flatMap(({ counted }) => counted) });
  if (lead <= maxLead) return [];
  return [`not in ${locale} as a whole: ${lead} more English function words than ${locale} ones. ${WHAT_TO_DO}`];
}
