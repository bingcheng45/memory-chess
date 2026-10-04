export const isTree = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

const keyPath = (path, key) => (path === "" ? key : `${path}.${key}`);

/**
 * Every leaf of `value` as `[path, leaf]`, in document order, with paths
 * written `sections[2].paragraphs[1]`. A flat map of key paths gives its own
 * keys back, so an article text and a chrome map go through the same checks.
 *
 * @param {unknown} value
 * @returns {[string, unknown][]}
 */
export function leavesOf(value, path = "") {
  if (Array.isArray(value)) return value.flatMap((item, index) => leavesOf(item, `${path}[${index}]`));
  if (isTree(value)) return Object.entries(value).flatMap(([key, item]) => leavesOf(item, keyPath(path, key)));
  return [[path, value]];
}

/**
 * A copy of `tree` with each leaf replaced by `leafAt(path)`. The copy keeps
 * the key order of `tree`, which is what makes a written file stable.
 *
 * @param {unknown} tree
 * @param {(path: string) => unknown} leafAt
 */
export function mapLeaves(tree, leafAt, path = "") {
  if (Array.isArray(tree)) return tree.map((item, index) => mapLeaves(item, leafAt, `${path}[${index}]`));
  if (!isTree(tree)) return leafAt(path);
  return Object.fromEntries(Object.entries(tree).map(([key, item]) => [key, mapLeaves(item, leafAt, keyPath(path, key))]));
}

/** `candidate`, which has the shape of `english`, with its keys in the order `english` has them. */
export function inOrderOf(english, candidate) {
  const leaves = new Map(leavesOf(candidate));
  return mapLeaves(english, (path) => leaves.get(path));
}
