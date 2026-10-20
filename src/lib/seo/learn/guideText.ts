// `scripts/articles-i18n.mjs` imports this file with Node's type stripping, so it may hold only erasable
// TypeScript and `import type` for every type.
import type { BodyBlock, EndBlock, InlineLink, LearnDocument, LearnSection, Rich } from "./schema";

type BlockText =
  | { readonly paragraphs: readonly string[] }
  | { readonly items: readonly string[] }
  | { readonly title: string; readonly body: string }
  | { readonly caption: string }
  | { readonly alt: string; readonly caption: string }
  | {
      readonly drills: readonly {
        readonly title: string;
        readonly description: string;
        readonly duration: string;
        readonly goal: string;
        readonly play?: { readonly label: string };
      }[];
    }
  | { readonly columns: readonly string[]; readonly rows: readonly { readonly label: string; readonly cells: readonly string[] }[] }
  | { readonly steps: readonly { readonly label: string; readonly duration: string; readonly detail: string }[] }
  | { readonly label: string }
  | { readonly label: string; readonly why: string };

type EndText =
  | { readonly label: string; readonly why: string }
  | { readonly items: readonly { readonly question: string; readonly answer: string }[] }
  | { readonly items: readonly { readonly reason: string }[] }
  | { readonly items: readonly { readonly note?: string }[] };

type SectionText = { readonly heading: string; readonly summary?: string; readonly blocks: readonly BlockText[] };

/**
 * What a translator translates of a guide: every string a reader reads, and nothing else. Sections are keyed by
 * their anchor, blocks keep their order. Positions, numbers of a round, links and dates stay in the English
 * document, so a translation cannot change them. Source titles stay as published and the search questions stay
 * English, since the search is English.
 */
export type GuideText = {
  readonly meta: {
    readonly title: string;
    readonly h1: string;
    readonly description: string;
    readonly keywords: { readonly primary: string; readonly secondary: readonly string[] };
  };
  readonly intro: { readonly quickAnswer: string; readonly takeaways: readonly string[]; readonly audience: readonly string[] };
  readonly sections: Readonly<Record<string, SectionText>>;
  readonly end: readonly EndText[];
};

const LINK_TAG = /<l(\d+)>(.*?)<\/l\1>/g;

/** A string as is, or its parts with link `n` written `<ln>text</ln>`, the tag an ICU message carries. */
export function richMessage(rich: Rich): string {
  if (typeof rich === "string") return rich;
  let link = 0;
  return rich.map((part) => (typeof part === "string" ? part : `<l${link}>${part.text}</l${link++}>`)).join("");
}

/** The parts of a translated message, each link taking the href of the English link of its number. */
export function richOf(message: string, english: Rich): Rich {
  if (typeof english === "string") return message;
  const links = english.filter((part): part is InlineLink => typeof part !== "string");
  const parts: (string | InlineLink)[] = [];
  let at = 0;
  for (const match of message.matchAll(LINK_TAG)) {
    const link = links[Number(match[1])];
    if (!link) throw new Error(`"${message}" has a link <l${match[1]}> the English text does not have`);
    if (match.index > at) parts.push(message.slice(at, match.index));
    parts.push({ text: match[2], href: link.href });
    at = match.index + match[0].length;
  }
  if (at < message.length) parts.push(message.slice(at));
  return parts;
}

function blockText(block: BodyBlock): BlockText {
  switch (block.kind) {
    case "prose":
      return { paragraphs: block.paragraphs.map(richMessage) };
    case "list":
      return { items: block.items.map(richMessage) };
    case "takeaway":
      return { title: block.title, body: block.body };
    case "board":
    case "rulesDemo":
      return { caption: block.caption };
    case "image":
      return { alt: block.alt, caption: block.caption };
    case "drills":
      return {
        drills: block.drills.map(({ title, description, duration, goal, play }) => ({
          title,
          description: richMessage(description),
          duration,
          goal,
          ...(play ? { play: { label: play.label } } : {}),
        })),
      };
    case "table":
      return { columns: block.columns, rows: block.rows.map(({ label, cells }) => ({ label, cells })) };
    case "plan":
      return { steps: block.steps.map(({ label, duration, detail }) => ({ label, duration, detail })) };
    case "affiliate":
      return { label: block.label };
    case "cta":
      return { label: block.target.label, why: block.why };
  }
}

function endText(block: EndBlock): EndText {
  switch (block.kind) {
    case "cta":
      return { label: block.target.label, why: block.why };
    case "faq":
      return { items: block.items.map(({ question, answer }) => ({ question, answer })) };
    case "furtherReading":
      return { items: block.items.map(({ reason }) => ({ reason })) };
    case "sources":
      return { items: block.items.map(({ note }) => (note === undefined ? {} : { note })) };
  }
}

const sectionText = ({ heading, summary, blocks }: LearnSection): SectionText => ({
  heading,
  ...(summary === undefined ? {} : { summary }),
  blocks: blocks.map(blockText),
});

export function textOf(doc: LearnDocument): GuideText {
  const { title, h1, description, keywords } = doc.meta;
  return {
    meta: { title, h1, description, keywords: { primary: keywords.primary, secondary: keywords.secondary } },
    intro: doc.intro,
    sections: Object.fromEntries(doc.sections.map((section) => [section.id, sectionText(section)])),
    end: doc.end.map(endText),
  };
}

function withBlockText(block: BodyBlock, text: unknown): BodyBlock {
  const t = text as Record<string, unknown>;
  switch (block.kind) {
    case "prose": {
      const paragraphs = t.paragraphs as readonly string[];
      return { ...block, paragraphs: block.paragraphs.map((p, i) => richOf(paragraphs[i], p)) as [Rich, ...Rich[]] };
    }
    case "list": {
      const items = t.items as readonly string[];
      return { ...block, items: block.items.map((item, i) => richOf(items[i], item)) as [Rich, ...Rich[]] };
    }
    case "takeaway":
      return { ...block, title: t.title as string, body: t.body as string };
    case "board":
    case "rulesDemo":
      return { ...block, caption: t.caption as string };
    case "image":
      return { ...block, alt: t.alt as string, caption: t.caption as string };
    case "drills": {
      const drills = t.drills as Extract<BlockText, { drills: unknown }>["drills"];
      return {
        ...block,
        drills: block.drills.map((drill, i) => ({
          ...drill,
          title: drills[i].title,
          description: richOf(drills[i].description, drill.description),
          duration: drills[i].duration,
          goal: drills[i].goal,
          ...(drill.play ? { play: { ...drill.play, label: drills[i].play?.label ?? drill.play.label } } : {}),
        })) as unknown as typeof block.drills,
      };
    }
    case "table": {
      const { columns, rows } = t as Extract<BlockText, { columns: unknown }>;
      return {
        ...block,
        columns: columns as typeof block.columns,
        rows: block.rows.map((row, i) => ({ ...row, label: rows[i].label, cells: rows[i].cells })),
      };
    }
    case "plan": {
      const steps = t.steps as Extract<BlockText, { steps: unknown }>["steps"];
      return { ...block, steps: block.steps.map((step, i) => ({ ...step, ...steps[i] })) };
    }
    case "affiliate":
      return { ...block, label: t.label as string };
    case "cta":
      return { ...block, target: { ...block.target, label: t.label as string }, why: t.why as string };
  }
}

function withEndText(block: EndBlock, text: unknown): EndBlock {
  const t = text as Record<string, unknown>;
  switch (block.kind) {
    case "cta":
      return { ...block, target: { ...block.target, label: t.label as string }, why: t.why as string };
    case "faq": {
      const items = t.items as readonly { question: string; answer: string }[];
      return { ...block, items: block.items.map((_, i) => ({ question: items[i].question, answer: items[i].answer })) as unknown as typeof block.items };
    }
    case "furtherReading": {
      const items = t.items as readonly { reason: string }[];
      return { ...block, items: block.items.map((item, i) => ({ ...item, reason: items[i].reason })) as unknown as typeof block.items };
    }
    case "sources": {
      const items = t.items as readonly { note?: string }[];
      return {
        ...block,
        items: block.items.map((item, i) => (item.note === undefined ? item : { ...item, note: items[i].note })) as unknown as typeof block.items,
      };
    }
  }
}

/** The English guide with its reader-facing strings taken from `text`, which must have the shape of `textOf(english)`. */
export function withText(english: LearnDocument, text: GuideText): LearnDocument {
  return {
    ...english,
    meta: {
      ...english.meta,
      title: text.meta.title,
      h1: text.meta.h1,
      description: text.meta.description,
      keywords: { primary: text.meta.keywords.primary, secondary: text.meta.keywords.secondary },
    },
    intro: text.intro,
    sections: english.sections.map((section) => {
      const translated = text.sections[section.id];
      return {
        ...section,
        heading: translated.heading,
        ...(section.summary === undefined ? {} : { summary: translated.summary }),
        blocks: section.blocks.map((block, i) => withBlockText(block, translated.blocks[i])),
      };
    }) as unknown as LearnDocument["sections"],
    end: english.end.map((block, i) => withEndText(block, text.end[i])),
  } as LearnDocument;
}
