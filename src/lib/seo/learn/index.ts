import GUIDE_CHROME, { type GuideChrome } from "./guideChrome";
import { LEARN_GUIDES } from "./guides";
import { LEARN_GROUPS, type FaqItem, type GameSetup, type LearnDocument, type LearnGroup } from "./schema";
import { readingMinutes } from "./text";

export * from "./schema";

export type TableOfContentsEntry = { readonly id: string; readonly label: string };

export type LearnPage = LearnDocument & {
  readonly group: LearnGroup;
  readonly readingMinutes: number;
  readonly tableOfContents: readonly TableOfContentsEntry[];
  /** The round the guide sends a reader to: its first game call to action, or else its first drill played on the site. */
  readonly primaryCta: GameSetup & { readonly label: string };
  readonly faq: readonly FaqItem[];
};

export const FAQ_ANCHOR = "faq";

function primaryCtaOf(doc: LearnDocument): LearnPage["primaryCta"] {
  for (const block of doc.end) {
    if (block.kind === "cta" && block.target.kind === "game") {
      const { label, pieceCount, memorizeTime, blindfold } = block.target;
      return { label, pieceCount, memorizeTime, ...(blindfold ? { blindfold } : {}) };
    }
  }
  for (const block of doc.sections.flatMap((section) => section.blocks)) {
    const play = block.kind === "drills" ? block.drills.find((drill) => drill.play)?.play : undefined;
    if (play) return play;
  }
  throw new Error(`${doc.meta.slug} has nothing to play`);
}

/** `chrome` names the group and the questions heading in the guide's language. */
export function toPage(doc: LearnDocument, chrome: GuideChrome = GUIDE_CHROME): LearnPage {
  const found = LEARN_GROUPS.find(({ id }) => id === doc.meta.group);
  if (!found) throw new Error(`${doc.meta.slug} names no group ${doc.meta.group}`);
  const group = { ...found, label: chrome.groups[found.id] };
  const faq = doc.end.flatMap((block) => (block.kind === "faq" ? block.items : []));

  return {
    ...doc,
    group,
    readingMinutes: readingMinutes(doc),
    tableOfContents: [
      ...doc.sections.map(({ id, heading }) => ({ id, label: heading })),
      ...(faq.length > 0 ? [{ id: FAQ_ANCHOR, label: chrome.faq }] : []),
    ],
    primaryCta: primaryCtaOf(doc),
    faq,
  };
}

export const EN_LEARN_PAGES: readonly LearnPage[] = LEARN_GUIDES.map((doc) => toPage(doc));

export const LEARN_SLUGS: readonly string[] = EN_LEARN_PAGES.map((page) => page.meta.slug);

/** Paths under /learn that are not guides, so no guide may take their slug. */
export const RESERVED_LEARN_SLUGS: readonly string[] = ["search"];

export function findLearnPage(slug: string): LearnPage | undefined {
  return EN_LEARN_PAGES.find((page) => page.meta.slug === slug);
}

/** The most recent guide edit, which is when the hub last changed. */
export const LEARN_LAST_UPDATED: string = EN_LEARN_PAGES.map((page) => page.meta.updatedAt).sort().at(-1) ?? "";

export type LearnGroupPages = { readonly group: LearnGroup; readonly pages: readonly LearnPage[] };

export function groupPages(pages: readonly LearnPage[]): LearnGroupPages[] {
  return LEARN_GROUPS.map((group) => ({ group, pages: pages.filter((page) => page.group.id === group.id) })).filter(
    ({ pages: inGroup }) => inGroup.length > 0,
  );
}
