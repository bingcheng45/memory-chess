import { IntlMessageFormat } from "intl-messageformat";

// Element types of the tree `IntlMessageFormat.getAst()` returns.
const LITERAL = 0;
const PLURAL = 6;
const TAG = 8;
const ARGUMENT_TYPES = new Set([1, 2, 3, 4, 5, PLURAL]);

const PROBE_COUNTS = [0, 1, 2, 5, 21];

const uniqueSorted = (names) => [...new Set(names)].sort();

function nodesOf(elements) {
  return elements.flatMap((element) => [
    element,
    ...nodesOf(element.children ?? []),
    ...Object.values(element.options ?? {}).flatMap((option) => nodesOf(option.value)),
  ]);
}

/**
 * What one ICU message is made of, or `{ error }` when it does not compile.
 *
 * @param {string} message
 * @param {string} locale
 * @returns {{ error: string } | {
 *   placeholders: string[],
 *   tags: string[],
 *   plurals: { name: string, type: string, categories: string[] }[],
 *   literalText: string,
 * }}
 */
export function partsOf(message, locale) {
  try {
    const nodes = nodesOf(new IntlMessageFormat(message, locale).getAst());
    const valuesOf = (isWanted) => nodes.filter(isWanted).map((node) => node.value);

    return {
      placeholders: uniqueSorted(valuesOf((node) => ARGUMENT_TYPES.has(node.type))),
      tags: uniqueSorted(valuesOf((node) => node.type === TAG)),
      plurals: nodes
        .filter((node) => node.type === PLURAL)
        .map(({ value, pluralType, options }) => ({ name: value, type: pluralType, categories: Object.keys(options) })),
      literalText: valuesOf((node) => node.type === LITERAL).join(" "),
    };
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * The error `message` throws when it is formatted for `locale`, or `undefined`.
 * Every argument takes each probe count in turn, so every plural branch a
 * reader can reach is formatted at least once.
 *
 * @param {string} message
 * @param {string} locale
 * @param {{ placeholders: string[], tags: string[] }} parts
 * @returns {string | undefined}
 */
export function formatError(message, locale, { placeholders, tags }) {
  const renderTag = (chunks) => chunks;
  const tagValues = Object.fromEntries(tags.map((tag) => [tag, renderTag]));

  try {
    const formatter = new IntlMessageFormat(message, locale);
    PROBE_COUNTS.forEach((count) =>
      formatter.format({ ...Object.fromEntries(placeholders.map((name) => [name, count])), ...tagValues }),
    );
    return undefined;
  } catch (error) {
    return error.message;
  }
}

export function literalTextOf(message, locale) {
  const parts = partsOf(message, locale);
  return parts.error === undefined ? parts.literalText : message;
}
