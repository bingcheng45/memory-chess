import { leavesOf } from "./leaves.mjs";
import { BODY_PATH } from "./paths.mjs";

// A heading of some 30 characters is often a third as long in Chinese or
// Japanese as the rest of the same translation, so short leaves are not measured.
const MAX_UNMEASURED_ENGLISH_LENGTH = 80;
const MIN_LEAVES_FOR_A_MEDIAN = 5;
const MIN_SHARE_OF_MEDIAN = 0.7;

function medianOf(numbers) {
  const sorted = [...numbers].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function measuredLeaves(articles, units) {
  return articles.flatMap(({ slug, text }) => {
    const translated = new Map(leavesOf(units[slug]?.text));

    return leavesOf(text).flatMap(([path, english]) => {
      const value = translated.get(path);
      const isMeasured =
        BODY_PATH.test(path) && english.length > MAX_UNMEASURED_ENGLISH_LENGTH && typeof value === "string" && value.trim() !== "";
      return isMeasured ? [{ slug, path, english: english.length, length: value.length, ratio: value.length / english.length }] : [];
    });
  });
}

/**
 * The long body leaves of one locale that are much shorter, against their
 * English leaf, than the rest of that locale's translation: a dropped sentence
 * or a paragraph replaced by a word. Each language has its own usual ratio, so
 * the measure is the median over every article in `units`.
 *
 * @param {{ slug: string, text: object }[]} articles the English articles
 * @param {Record<string, { text?: unknown }>} units the translation of each, by slug
 * @returns {string[]}
 */
export function contentLossFailures(articles, units) {
  const leaves = measuredLeaves(articles, units);
  if (leaves.length < MIN_LEAVES_FOR_A_MEDIAN) return [];
  const usual = medianOf(leaves.map((leaf) => leaf.ratio));

  return leaves
    .filter((leaf) => leaf.ratio < MIN_SHARE_OF_MEDIAN * usual)
    .map(
      ({ slug, path, english, length, ratio }) =>
        `${slug} ${path}: ${length} characters for ${english} in English is ${(ratio / usual).toFixed(2)} of this ` +
        `translation's usual ratio, the least is ${MIN_SHARE_OF_MEDIAN}, text looks dropped`,
    );
}
