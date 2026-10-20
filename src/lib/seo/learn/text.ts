import type { LearnBlock, LearnDocument, LearnSection, Rich } from "./schema";

export function richText(rich: Rich): string {
  return typeof rich === "string" ? rich : rich.map((part) => (typeof part === "string" ? part : part.text)).join("");
}

/** The reading text a block shows. Links, labels and chrome are left out, so the count matches what a reader reads. */
export function blockText(block: LearnBlock): string[] {
  switch (block.kind) {
    case "prose":
      return block.paragraphs.map(richText);
    case "list":
      return block.items.map(richText);
    case "takeaway":
      return [block.title, block.body];
    case "board":
    case "image":
    case "rulesDemo":
      return [block.caption];
    case "drills":
      return block.drills.flatMap((drill) => [drill.title, richText(drill.description), drill.duration, drill.goal]);
    case "table":
      return [...block.columns, ...block.rows.flatMap((row) => [row.label, ...row.cells])];
    case "plan":
      return block.steps.flatMap((step) => [step.label, step.duration, step.detail]);
    case "affiliate":
      return [];
    case "cta":
      return [block.why];
    case "faq":
      return block.items.flatMap((item) => [item.question, item.answer]);
    case "furtherReading":
      return block.items.map((item) => item.reason);
    case "sources":
      return block.items.flatMap((item) => [item.title, item.note ?? ""]);
    default: {
      const unhandled: never = block;
      throw new Error(`no text for block ${JSON.stringify(unhandled)}`);
    }
  }
}

export function sectionText(section: LearnSection): string[] {
  return [section.heading, section.summary ?? "", ...section.blocks.flatMap(blockText)];
}

const wordCount = (texts: readonly string[]) => texts.join(" ").split(/\s+/).filter(Boolean).length;

function readingWords(doc: LearnDocument): number {
  const faq = doc.end.flatMap((block) => (block.kind === "faq" ? blockText(block) : []));
  return wordCount([
    doc.meta.h1,
    doc.meta.description,
    doc.intro.quickAnswer,
    ...doc.intro.takeaways,
    ...doc.intro.audience,
    ...doc.sections.flatMap(sectionText),
    ...faq,
  ]);
}

const WORDS_PER_MINUTE = 220;
const MIN_READING_MINUTES = 3;

export function readingMinutes(doc: LearnDocument): number {
  return Math.max(MIN_READING_MINUTES, Math.round(readingWords(doc) / WORDS_PER_MINUTE));
}
