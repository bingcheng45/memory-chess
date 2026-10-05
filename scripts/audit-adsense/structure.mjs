/**
 * The blocks a translation must have as many of as its English page. A word
 * count depends on the language, the number of blocks does not.
 */
const COUNTED_BLOCKS = [
  { name: "h2", pattern: /<h2\b/gi },
  { name: "p", pattern: /<p\b/gi },
  { name: "li", pattern: /<li\b/gi },
  { name: "article card", pattern: /\sdata-article-card=/gi },
];

/**
 * Elements a translator does not decide on, left out before the blocks are
 * counted: the note only a translation carries, and the view and like counts,
 * which a page prints once its article has one. Each locale's copy of a page
 * is cached and renewed by itself, so two copies can differ in these for
 * minutes with nothing wrong.
 */
export const UNCOUNTED_MARKS = ["data-translation-note", "data-article-counts"];

export const COUNTED_BLOCK_NAMES = COUNTED_BLOCKS.map(({ name }) => name).join(", ");

export function blockCounts(mainHtml) {
  return Object.fromEntries(COUNTED_BLOCKS.map(({ name, pattern }) => [name, (mainHtml.match(pattern) ?? []).length]));
}

export function differingBlocks(blocks, englishBlocks) {
  return COUNTED_BLOCKS.map(({ name }) => ({ name, count: blocks[name], englishCount: englishBlocks[name] })).filter(({ count, englishCount }) => count !== englishCount);
}
