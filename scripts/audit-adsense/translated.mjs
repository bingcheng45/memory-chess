import { COUNTED_BLOCK_NAMES, differingBlocks } from "./structure.mjs";
import { SEGMENTED_COUNTER, SPACED_COUNTER, countLocaleWords } from "./words.mjs";

const THIN_PAGE_WORDS = 300;

/**
 * The schema.org types an English page declares when it is written prose. Its
 * translation owes the reader a note. A page of interface, as the leaderboard
 * is, declares neither and owes none.
 */
const PROSE_SCHEMA_TYPES = ["Article", "CollectionPage"];

const plural = (count, noun) => `${count} ${noun}${count === 1 ? "" : "s"}`;

function alternatesProblem(alternates, where) {
  return alternates.length ? [`${plural(alternates.length, "hreflang alternate")} in the ${where}, e.g. ${alternates[0].lang} ${alternates[0].href}`] : [];
}

function blockProblem({ page, english, proseType }) {
  // A page of interface prints the rows it has at the moment, so its blocks say nothing about its translation.
  if (!proseType) return [];
  const differing = differingBlocks(page.blocks, english.blocks);
  const clauses = differing.map(({ name, count, englishCount }, i) => `${count} ${name} where ${i ? "it" : english.path} has ${englishCount}`);
  return clauses.length ? [clauses.join(", ")] : [];
}

function noteProblem({ page, english, proseType }, { sameUrl }) {
  if (!proseType) return [];
  const links = page.translationNoteLinks;
  if (!links) return [`no translation note (data-translation-note), though ${english.path} declares a schema.org ${proseType}`];
  return links.some((href) => sameUrl(href, english.url)) ? [] : [`the translation note links to ${links.join(", ") || "nothing"}, expected ${english.path}`];
}

/**
 * One rule per promise a translated page makes. Each takes a page served in
 * translation, measured against its English page, and the site's URL matcher.
 */
export const TRANSLATED_RULES = [
  {
    id: "translated-noindex",
    guideline: "a translated page is served to readers and never offered to search",
    check: ({ page }) => (/noindex/i.test(page.robots) ? [] : [`robots="${page.robots}", expected noindex`]),
  },
  {
    id: "translated-canonical",
    guideline: "a translated page is canonical to itself, not to the English page",
    check: ({ page }, { sameUrl }) => {
      if (!page.canonical) return ["missing canonical"];
      return sameUrl(page.canonical, page.url) ? [] : [`canonical points elsewhere: ${page.canonical}`];
    },
  },
  {
    id: "translated-hreflang",
    guideline: "a translated page names no language alternates, in the HTML or the Link header",
    check: ({ page }) => [...alternatesProblem(page.hreflang, "HTML"), ...alternatesProblem(page.headerHreflang, "Link header")],
  },
  {
    id: "translated-structure",
    guideline: "G11 G22 one h1",
    check: ({ page }) => (page.h1Count === 1 ? [] : [`${page.h1Count} h1 elements`]),
  },
  {
    id: "translated-hidden-text",
    guideline: "G19 no text hidden at any viewport",
    check: ({ page }) =>
      page.hiddenWords === 0 ? [] : [`${plural(page.hiddenWords, "word")} ship hidden (inline style, hidden attribute, hidden class, or breakpoint-hidden class)`],
  },
  {
    id: "translated-dropped-content",
    guideline: `a translated page of written text has as many of each block (${COUNTED_BLOCK_NAMES}) in main content as its English page`,
    check: blockProblem,
  },
  {
    id: "translation-note",
    guideline: "a translated article says it is a translation and links to the English page",
    check: noteProblem,
  },
];

function measure({ page, english }) {
  const { words, counter } = countLocaleWords(page.mainText, page.locale);
  const proseType = PROSE_SCHEMA_TYPES.find((type) => english.schemaTypes.includes(type)) ?? null;
  return { page, english, words, counter, proseType };
}

function toRow(measured, site) {
  const { page, english, words, counter, proseType } = measured;
  return {
    url: page.url,
    path: page.path,
    locale: page.locale,
    english: english.path,
    robots: page.robots,
    canonical: page.canonical,
    h1Count: page.h1Count,
    hiddenWords: page.hiddenWords,
    words,
    counter,
    blocks: page.blocks,
    englishBlocks: english.blocks,
    owesNote: Boolean(proseType),
    findings: TRANSLATED_RULES.flatMap((rule) => rule.check(measured, site).map((message) => ({ rule: rule.id, message }))),
  };
}

/** One report row for each `{ page, english }` pair served in translation. */
export function translatedRows(served, site) {
  return served.map((pair) => toRow(measure(pair), site));
}

function countersUsed(rows) {
  return [SEGMENTED_COUNTER, SPACED_COUNTER]
    .map((counter) => ({ counter, locales: [...new Set(rows.filter((row) => row.counter === counter).map((row) => row.locale))].sort() }))
    .filter(({ locales }) => locales.length)
    .map(({ counter, locales }) => `${counter} in ${locales.join(", ")}`)
    .join(" and as ");
}

export function translatedLines(rows) {
  const title = "translated pages (noindex under a locale prefix)";
  if (!rows.length) return [`${title}: none served, so none checked`];
  const thin = rows.filter((row) => row.words < THIN_PAGE_WORDS);
  const written = rows.filter((row) => row.owesNote).length;
  return [
    `${title}: ${rows.length} checked against their English pages, ${written} of them owing a translation note`,
    `  words counted as ${countersUsed(rows)}`,
    `  blocks compared with the English page on the ${written} that ${written === 1 ? "owes" : "owe"} a note: ${COUNTED_BLOCK_NAMES} (the translation note and the view and like counts left out)`,
    ...(thin.length ? [`  under ${THIN_PAGE_WORDS} words, reported and not failed: ${thin.map((row) => `${row.path} ${row.words}`).join(", ")}`] : []),
  ];
}
