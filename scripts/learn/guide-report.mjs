/**
 * Prints the measurable side of one Learn guide, so editors and reviewers argue from the same numbers.
 *   node scripts/learn/guide-report.mjs <slug>        one guide
 *   node scripts/learn/guide-report.mjs --all          one summary line per guide
 */
import "../lab/ts-hooks.mjs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const load = (path) => import(pathToFileURL(join(process.cwd(), path)).href);
const { EN_LEARN_PAGES } = await load("src/lib/seo/learn/index.ts");
const { blockText, sectionText, richText, readingMinutes } = await load("src/lib/seo/learn/text.ts");

const VISUAL_KINDS = new Set(["board", "image", "table", "plan"]);
const SHARED_SENTENCE_WORDS = 6;
/** The site appends " | Memory Chess" and a full title must fit 64 characters. */
const MAX_TITLE = 49;
const MAX_SENTENCE_WORDS = 28;

const words = (text) => text.split(/\s+/).filter(Boolean);
const sentences = (text) =>
  text
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"'])/)
    .map((s) => s.trim())
    .filter((s) => words(s).length >= 3);

function allText(page) {
  return [
    page.meta.h1,
    page.meta.description,
    page.intro.quickAnswer,
    ...page.intro.takeaways,
    ...page.intro.audience,
    ...page.sections.flatMap(sectionText),
    ...page.end.flatMap(blockText),
  ].filter(Boolean);
}

function links(value, found = []) {
  if (Array.isArray(value)) value.forEach((item) => links(item, found));
  else if (value && typeof value === "object") {
    if (typeof value.href === "string") found.push({ text: value.text ?? "", href: value.href });
    if (value.kind === "guide" && value.slug) found.push({ text: "(further reading)", href: `/learn/${value.slug}` });
    if (value.kind === "article" && value.slug) found.push({ text: "(article)", href: `/articles/${value.slug}` });
    Object.values(value).forEach((item) => links(item, found));
  }
  return found;
}

const sentenceIndex = new Map();
for (const page of EN_LEARN_PAGES) {
  for (const sentence of new Set(allText(page).flatMap(sentences))) {
    if (words(sentence).length < SHARED_SENTENCE_WORDS) continue;
    sentenceIndex.set(sentence, [...(sentenceIndex.get(sentence) ?? []), page.meta.slug]);
  }
}
const headingIndex = new Map();
for (const page of EN_LEARN_PAGES) {
  for (const section of page.sections) {
    const key = section.heading.toLowerCase();
    headingIndex.set(key, [...(headingIndex.get(key) ?? []), page.meta.slug]);
  }
}

function report(page) {
  const { meta, intro, sections } = page;
  const body = allText(page);
  const bodySentences = body.flatMap(sentences);
  const lengths = bodySentences.map((s) => words(s).length);
  const blocks = sections.flatMap((section) => section.blocks);
  const visuals = blocks.filter((block) => VISUAL_KINDS.has(block.kind)).map((block) => block.kind);
  const proseParagraphs = blocks.filter((block) => block.kind === "prose").flatMap((block) => block.paragraphs.map(richText));
  const longParagraphs = proseParagraphs.filter((p) => sentences(p).length > 5).length;
  const faq = page.end.find((block) => block.kind === "faq");
  const primary = meta.keywords.primary.toLowerCase();
  const opening = words(intro.quickAnswer).slice(0, 100).join(" ").toLowerCase();
  const allLinks = links(page);
  const internal = allLinks.filter((link) => link.href.startsWith("/"));
  const shared = [...sentenceIndex.entries()].filter(([, slugs]) => slugs.includes(meta.slug) && slugs.length > 1);
  const sharedHeadings = sections.filter((section) => headingIndex.get(section.heading.toLowerCase()).length > 1);
  const totalWords = words(body.join(" ")).length;

  return {
    slug: meta.slug,
    title: `${meta.title} (${meta.title.length} chars${meta.title.length > MAX_TITLE ? `, over ${MAX_TITLE}` : ""})`,
    h1: meta.h1,
    description: `${meta.description.length} chars`,
    primaryKeyword: meta.keywords.primary,
    primaryIn: {
      title: meta.title.toLowerCase().includes(primary),
      h1: meta.h1.toLowerCase().includes(primary),
      description: meta.description.toLowerCase().includes(primary),
      quickAnswer: opening.includes(primary),
    },
    quickAnswerWords: words(intro.quickAnswer).length,
    questions: meta.questions,
    words: totalWords,
    readingMinutes: readingMinutes(page),
    sentences: bodySentences.length,
    avgSentenceWords: Number((lengths.reduce((a, b) => a + b, 0) / Math.max(1, lengths.length)).toFixed(1)),
    sentencesOverLimit: bodySentences.filter((s) => words(s).length > MAX_SENTENCE_WORDS),
    paragraphsOver5Sentences: longParagraphs,
    headings: sections.map((section) => section.heading),
    headingsSharedWithOtherGuides: sharedHeadings.map((section) => section.heading),
    visuals,
    wordsPerVisual: visuals.length ? Math.round(totalWords / visuals.length) : null,
    internalLinks: internal.map((link) => `${link.text} -> ${link.href}`),
    faq: faq ? faq.items.map((item) => `${item.question} (${words(item.answer).length} words)`) : [],
    sentencesSharedWithOtherGuides: shared.map(([sentence, slugs]) => `${sentence} [${slugs.filter((s) => s !== meta.slug).join(", ")}]`),
  };
}

const arg = process.argv[2];
if (arg === "--all") {
  for (const page of EN_LEARN_PAGES) {
    const r = report(page);
    console.log(`${r.slug}: ${r.words} words, ${r.readingMinutes} min, answer ${r.quickAnswerWords} w, avg ${r.avgSentenceWords} w/sentence, ${r.visuals.length} visuals, ${r.internalLinks.length} internal links, ${r.sentencesSharedWithOtherGuides.length} shared sentences`);
  }
} else {
  const page = EN_LEARN_PAGES.find((candidate) => candidate.meta.slug === arg);
  if (!page) {
    console.error(`No guide with slug "${arg}". Slugs: ${EN_LEARN_PAGES.map((p) => p.meta.slug).join(", ")}`);
    process.exit(1);
  }
  console.log(JSON.stringify(report(page), null, 2));
}
