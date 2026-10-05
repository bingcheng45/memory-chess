/**
 * The blocks a translation must have as many of as its English page. A word
 * count depends on the language, the number of blocks does not.
 */
export const COUNTED_BLOCKS = [
  { name: "h2", pattern: /<h2\b/gi },
  { name: "p", pattern: /<p\b/gi },
  { name: "li", pattern: /<li\b/gi },
  { name: "article card", pattern: /\sdata-article-card=/gi },
];

/** The number of each counted block in `mainHtml`, as { h2, p, li, "article card" }. */
export function blockCounts(mainHtml) {
  return Object.fromEntries(COUNTED_BLOCKS.map(({ name, pattern }) => [name, (mainHtml.match(pattern) ?? []).length]));
}

/** The kinds whose count differs between a page and its English page, in table order. */
export function differingBlocks(blocks, englishBlocks) {
  return COUNTED_BLOCKS.map(({ name }) => ({ name, count: blocks[name], englishCount: englishBlocks[name] })).filter(({ count, englishCount }) => count !== englishCount);
}

/** `h2, p, li, article card`: the kinds counted, as the report names them. */
export const countedBlockNames = () => COUNTED_BLOCKS.map(({ name }) => name).join(", ");
