import type {
  BoardArrow,
  BoardMark,
  BodyBlock,
  CtaBlock,
  EndBlock,
  LearnDocument,
  LearnGroupId,
  LearnLevel,
  LearnSection,
  Rich,
} from "@/lib/seo/learn/schema";
import type { LearnPosition } from "@/lib/seo/learn/positions";

/** The guide shape before the LearnDocument template, as src/lib/seo/learn/guides held it until the migration. */
export type LegacyLink = { phrase: string; href: string };
export type LegacyBlock =
  | { kind: "paragraphs"; paragraphs: string[]; link?: LegacyLink }
  | { kind: "steps"; ordered: boolean; items: string[] }
  | { kind: "callout"; title: string; body: string }
  | {
      kind: "drills";
      drills: {
        title: string;
        description: string;
        duration: string;
        goal: string;
        ctaLabel: string;
        link?: LegacyLink;
        setup?: { pieceCount: number; memorizeTime: number };
      }[];
    }
  | { kind: "comparison"; columns: [string, string, string]; rows: { label: string; struggling: string; stronger: string }[] }
  | { kind: "plan"; steps: { label: string; duration: string; detail: string }[] };

export type LegacyGuide = {
  slug: string;
  title: string;
  h1: string;
  description: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  ctaLabel: string;
  quickAnswer: string;
  keyTakeaways?: string[];
  whoThisIsFor?: string[];
  difficulty: "Beginner" | "Beginner to Intermediate";
  featured?: boolean;
  publishedAt: string;
  updatedAt: string;
  sections: { id: string; title: string; summary?: string; blocks: LegacyBlock[] }[];
  faq: { question: string; answer: string }[];
  relatedArticles: { slug: string; reason: string }[];
  furtherReading?: { slug: string; anchor: string }[];
  sources: { title: string; url: string; note?: string }[];
};

export type LegacyPosition = LearnPosition & { sectionId: string };

/** A diagram placed by hand: drawn after paragraph `after` of its section's first prose block. */
export type BoardPlacement = {
  readonly position: string;
  readonly after: number;
  readonly caption: string;
  readonly arrows?: readonly BoardArrow[];
  readonly marks?: readonly BoardMark[];
};

/** What the template needs that the legacy guide never held, written per guide. */
export type Authored = {
  readonly group: LearnGroupId;
  readonly questions: readonly string[];
  /** Why to play the page's round, in this guide's words. */
  readonly gameWhy: string;
  readonly description?: string;
  readonly articles?: Readonly<Record<string, { readonly label: string; readonly why: string }>>;
  readonly extraCtas?: readonly CtaBlock[];
  readonly boards?: Readonly<Record<string, readonly BoardPlacement[]>>;
};

const LEVELS: Record<LegacyGuide["difficulty"], LearnLevel> = {
  Beginner: "beginner",
  "Beginner to Intermediate": "improver",
};

function nonEmpty<T>(items: readonly T[], what: string): [T, ...T[]] {
  if (items.length === 0) throw new Error(`${what} is empty`);
  return items as [T, ...T[]];
}

function sitePath(href: string): `/${string}` {
  if (!href.startsWith("/")) throw new Error(`inline link ${href} is not a site path`);
  return href as `/${string}`;
}

function linked(text: string, link?: LegacyLink): Rich {
  const at = link ? text.indexOf(link.phrase) : -1;
  if (!link || at === -1) return text;
  return [text.slice(0, at), { text: link.phrase, href: sitePath(link.href) }, text.slice(at + link.phrase.length)].filter(
    (part) => part !== "",
  );
}

function prose(paragraphs: readonly string[], link?: LegacyLink): BodyBlock {
  return { kind: "prose", paragraphs: nonEmpty(paragraphs.map((paragraph) => linked(paragraph, link)), "prose") };
}

function convertBlock(block: LegacyBlock): BodyBlock {
  switch (block.kind) {
    case "paragraphs":
      return prose(block.paragraphs, block.link);
    case "steps":
      return { kind: "list", ordered: block.ordered, items: nonEmpty(block.items, "list") };
    case "callout":
      return { kind: "takeaway", title: block.title, body: block.body };
    case "drills":
      return {
        kind: "drills",
        drills: nonEmpty(
          block.drills.map(({ title, description, duration, goal, ctaLabel, link, setup }) => ({
            title,
            description: linked(description, link),
            duration,
            goal,
            ...(setup ? { play: { label: ctaLabel, pieceCount: setup.pieceCount, memorizeTime: setup.memorizeTime } } : {}),
          })),
          "drills",
        ),
      };
    case "comparison":
      return {
        kind: "table",
        columns: block.columns,
        rows: block.rows.map(({ label, struggling, stronger }) => ({ label, cells: [struggling, stronger] })),
      };
    case "plan":
      return { kind: "plan", steps: block.steps };
  }
}

function withoutSection({ sectionId: _sectionId, ...position }: LegacyPosition): LearnPosition {
  return position;
}

function sectionBlocks(
  blocks: readonly LegacyBlock[],
  placements: readonly BoardPlacement[],
  positionById: ReadonlyMap<string, LegacyPosition>,
): BodyBlock[] {
  let pending = [...placements];
  return blocks.flatMap((block): BodyBlock[] => {
    if (block.kind !== "paragraphs" || pending.length === 0) return [convertBlock(block)];
    const out: BodyBlock[] = [];
    let start = 0;
    for (const placement of pending) {
      const position = positionById.get(placement.position);
      if (!position) throw new Error(`no position ${placement.position}`);
      out.push(prose(block.paragraphs.slice(start, placement.after + 1), block.link));
      out.push({
        kind: "board",
        position: withoutSection(position),
        ...(placement.arrows ? { arrows: placement.arrows } : {}),
        ...(placement.marks ? { marks: placement.marks } : {}),
        caption: placement.caption,
      });
      start = placement.after + 1;
    }
    pending = [];
    if (start < block.paragraphs.length) out.push(prose(block.paragraphs.slice(start), block.link));
    return out;
  });
}

function endBlocks(guide: LegacyGuide, authored: Authored): EndBlock[] {
  const firstRound = guide.sections
    .flatMap((section) => section.blocks)
    .flatMap((block) => (block.kind === "drills" ? block.drills : []))
    .find((drill) => drill.setup)?.setup;
  if (!firstRound) throw new Error(`${guide.slug} has no round to play`);

  const articles = (guide.furtherReading ?? []).map(({ slug }): CtaBlock => {
    const copy = authored.articles?.[slug];
    if (!copy) throw new Error(`${guide.slug} has no copy for article ${slug}`);
    return { kind: "cta", target: { kind: "article", slug, label: copy.label }, why: copy.why };
  });

  return [
    { kind: "cta", target: { kind: "game", label: guide.ctaLabel, ...firstRound }, why: authored.gameWhy },
    ...(authored.extraCtas ?? []),
    ...articles,
    ...(guide.faq.length > 0 ? [{ kind: "faq", items: nonEmpty(guide.faq, "faq") } as const] : []),
    {
      kind: "furtherReading",
      items: nonEmpty(
        guide.relatedArticles.map(({ slug, reason }) => ({ kind: "guide", slug, reason }) as const),
        "furtherReading",
      ),
    },
    ...(guide.sources.length > 0
      ? [
          {
            kind: "sources",
            items: nonEmpty(
              guide.sources.map(({ url, ...source }) => {
                if (!url.startsWith("https://")) throw new Error(`source ${url} is not https`);
                return { ...source, url: url as `https://${string}` };
              }),
              "sources",
            ),
          } as const,
        ]
      : []),
  ];
}

/** One legacy guide and its positions, in the LearnDocument template. Positions land in the section that states them. */
export function convertGuide(guide: LegacyGuide, positions: readonly LegacyPosition[], authored: Authored): LearnDocument {
  const faqQuestions = new Set(guide.faq.map(({ question }) => question.toLowerCase()));
  const [first, second, ...rest] = authored.questions.filter((question) => !faqQuestions.has(question.toLowerCase()));
  if (first === undefined || second === undefined) throw new Error(`${guide.slug} keeps fewer than two questions`);

  const drawn = new Set(Object.values(authored.boards ?? {}).flatMap((placements) => placements.map((p) => p.position)));
  const positionById = new Map(positions.map((position) => [position.id, position]));

  const sections = guide.sections.map((section): LearnSection => {
    const facts = positions.filter((position) => position.sectionId === section.id && !drawn.has(position.id)).map(withoutSection);
    return {
      id: section.id,
      heading: section.title,
      ...(section.summary ? { summary: section.summary } : {}),
      blocks: nonEmpty(sectionBlocks(section.blocks, authored.boards?.[section.id] ?? [], positionById), section.id),
      ...(facts.length > 0 ? { facts } : {}),
    };
  });

  return {
    meta: {
      slug: guide.slug,
      title: guide.title,
      h1: guide.h1,
      description: authored.description ?? guide.description,
      group: authored.group,
      level: LEVELS[guide.difficulty],
      publishedAt: guide.publishedAt,
      updatedAt: guide.updatedAt,
      questions: [first, second, ...rest],
      keywords: { primary: guide.primaryKeyword, secondary: guide.secondaryKeywords },
      ...(guide.featured ? { featured: true as const } : {}),
    },
    intro: { quickAnswer: guide.quickAnswer, takeaways: guide.keyTakeaways ?? [], audience: guide.whoThisIsFor ?? [] },
    sections: nonEmpty(sections, "sections"),
    end: endBlocks(guide, authored),
  };
}
