import { existsSync } from "node:fs";
import { join } from "node:path";
import { ARTICLE_SLUGS } from "@/lib/articles";
import { LEARN_GUIDES } from "../guides";
import { EN_LEARN_PAGES, LEARN_SLUGS, RESERVED_LEARN_SLUGS, groupPages, toPage } from "..";
import type { BodyBlock, InlineLink, LearnDocument, Rich } from "../schema";
import { readingMinutes } from "../text";
import messages from "../../../../../messages/en.json";

const SITE_PATHS = ["/settings", "/game", "/dashboard", "/learn", "/articles"];

const blocks = (doc: LearnDocument): BodyBlock[] => doc.sections.flatMap((section) => section.blocks);
const linksIn = (rich: Rich): InlineLink[] => (typeof rich === "string" ? [] : rich.filter((part) => typeof part !== "string"));
const faqQuestions = (doc: LearnDocument) => doc.end.flatMap((block) => (block.kind === "faq" ? block.items : [])).map((item) => item.question);

function words(count: number): string {
  return Array.from({ length: count }, () => "word").join(" ");
}

function fixture(proseWords: number): LearnDocument {
  return {
    meta: {
      slug: "fixture",
      title: "Fixture",
      h1: "Fixture",
      description: "A fixture.",
      group: "memory",
      level: "beginner",
      publishedAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      questions: ["One?", "Two?"],
      keywords: { primary: "fixture", secondary: [] },
    },
    intro: { quickAnswer: "Answer.", takeaways: [], audience: [] },
    sections: [{ id: "only", heading: "Only", blocks: [{ kind: "prose", paragraphs: [words(proseWords)] }] }],
    end: [
      { kind: "cta", target: { kind: "game", label: "Play", pieceCount: 6, memorizeTime: 10 }, why: "Why play." },
      { kind: "faq", items: [{ question: "Asked?", answer: words(10) }] },
    ],
  };
}

describe("derived page values", () => {
  it("reads at 220 words a minute and never under three minutes", () => {
    expect(readingMinutes(fixture(100))).toBe(3);
    expect(readingMinutes(fixture(1100))).toBe(5);
    expect(readingMinutes(fixture(1430))).toBe(7);
  });

  it("gives every live guide its derived read time", () => {
    expect(Object.fromEntries(EN_LEARN_PAGES.map((page) => [page.meta.slug, page.readingMinutes]))).toEqual({
      "how-to-get-better-at-chess-for-beginners": 7,
      "how-to-stop-blundering-in-chess": 6,
      "why-puzzle-rating-doesnt-transfer-to-games": 6,
      "chess-coordinates-practice": 6,
      "chess-visualization-exercises": 6,
      "how-to-see-the-whole-board-in-chess": 5,
      "chess-calculation-exercises-for-beginners": 7,
      "blindfold-chess-training-for-beginners": 8,
      "chess-memory-training": 8,
      "chess-pattern-recognition-drills": 6,
      "how-to-think-in-chess-for-beginners": 5,
      "20-minute-daily-chess-study-plan": 5,
      "how-to-analyze-chess-games-for-beginners": 6,
      "how-many-chess-puzzles-a-day": 4,
    });
  });

  it("lists each section and the FAQ in the contents, and plays the first game call to action", () => {
    const page = toPage(fixture(10));

    expect(page.tableOfContents).toEqual([
      { id: "only", label: "Only" },
      { id: "faq", label: "Questions" },
    ]);
    expect(page.primaryCta).toEqual({ label: "Play", pieceCount: 6, memorizeTime: 10 });
    expect(page.group.label).toBe("Memory and patterns");
  });
});

describe("hub grouping", () => {
  it("puts the live guides in five groups in reading order", () => {
    expect(groupPages(EN_LEARN_PAGES).map(({ group, pages }) => [group.id, pages.map((page) => page.meta.slug)])).toEqual([
      ["foundations", ["how-to-get-better-at-chess-for-beginners", "how-to-think-in-chess-for-beginners"]],
      [
        "board-vision",
        [
          "how-to-stop-blundering-in-chess",
          "why-puzzle-rating-doesnt-transfer-to-games",
          "chess-coordinates-practice",
          "how-to-see-the-whole-board-in-chess",
        ],
      ],
      [
        "visualization",
        ["chess-visualization-exercises", "chess-calculation-exercises-for-beginners", "blindfold-chess-training-for-beginners"],
      ],
      ["memory", ["chess-memory-training", "chess-pattern-recognition-drills"]],
      [
        "practice",
        ["20-minute-daily-chess-study-plan", "how-to-analyze-chess-games-for-beginners", "how-many-chess-puzzles-a-day"],
      ],
    ]);
  });

  it("shows a group only once it holds a guide", () => {
    expect(groupPages([toPage(fixture(10))]).map(({ group }) => group.id)).toEqual(["memory"]);
  });
});

describe("rules the types cannot hold", () => {
  it("keeps titles to 60 characters and descriptions to 160", () => {
    const long = LEARN_GUIDES.flatMap(({ meta }) => [
      ...(meta.title.length > 60 ? [`${meta.slug} title ${meta.title.length}`] : []),
      ...(meta.description.length > 160 ? [`${meta.slug} description ${meta.description.length}`] : []),
    ]);

    expect(long).toEqual([]);
  });

  it("keeps seven answer-first descriptions to 155 characters with the exact primary keyword", () => {
    const answerFirst = [
      "blindfold-chess-training-for-beginners",
      "chess-coordinates-practice",
      "chess-memory-training",
      "chess-pattern-recognition-drills",
      "chess-visualization-exercises",
      "how-many-chess-puzzles-a-day",
      "how-to-see-the-whole-board-in-chess",
    ];
    const misses = LEARN_GUIDES.filter(({ meta }) => answerFirst.includes(meta.slug)).flatMap(({ meta }) => [
      ...(meta.description.length > 155 ? [`${meta.slug} description ${meta.description.length}`] : []),
      ...(meta.description.toLowerCase().includes(meta.keywords.primary) ? [] : [`${meta.slug} description lacks ${meta.keywords.primary}`]),
    ]);

    expect(misses).toEqual([]);
  });

  it("names the game's buttons the way the game labels them", () => {
    const buttons = [messages.game.result.tryAgain, messages.game.result.nextRound, messages.game.result.changeSettings, messages.game.round.hide];
    expect(buttons).toEqual(["Try again", "Next round", "Change settings", "Hide board"]);

    const misnamed = LEARN_GUIDES.flatMap((doc) => {
      const text = JSON.stringify(doc);
      return buttons.flatMap((label) =>
        [...text.matchAll(new RegExp(label, "gi"))]
          .map(([found]) => found)
          .filter((found) => found !== label && found !== label.toLowerCase())
          .map((found) => `${doc.meta.slug}: ${found}`),
      );
    });

    expect(misnamed).toEqual([]);
  });

  it("asks questions that end in a question mark and repeat no FAQ question", () => {
    const bad = LEARN_GUIDES.flatMap((doc) =>
      doc.meta.questions
        .filter((question) => !question.endsWith("?") || faqQuestions(doc).includes(question))
        .map((question) => `${doc.meta.slug}: ${question}`),
    );

    expect(bad).toEqual([]);
  });

  it("points every link, further reading item and article call to action at a live page", () => {
    const broken = LEARN_GUIDES.flatMap((doc) => {
      const inline = blocks(doc).flatMap((block) => {
        if (block.kind === "prose") return block.paragraphs.flatMap(linksIn);
        if (block.kind === "list") return block.items.flatMap(linksIn);
        if (block.kind === "drills") return block.drills.flatMap((drill) => linksIn(drill.description));
        return [];
      });
      const targets = [
        ...inline.filter(({ href }) => !SITE_PATHS.includes(href)).map(({ href }) => href),
        ...doc.end.flatMap((block) => {
          if (block.kind === "furtherReading") {
            return block.items
              .filter((item) => !(item.kind === "guide" ? LEARN_SLUGS : ARTICLE_SLUGS).includes(item.slug))
              .map((item) => item.slug);
          }
          if (block.kind === "cta" && block.target.kind === "article" && !ARTICLE_SLUGS.includes(block.target.slug)) {
            return [block.target.slug];
          }
          return [];
        }),
      ];
      return targets.map((target) => `${doc.meta.slug} -> ${target}`);
    });

    expect(broken).toEqual([]);
  });

  it("fills every table row to one cell per value column", () => {
    const ragged = LEARN_GUIDES.flatMap((doc) =>
      blocks(doc).flatMap((block) =>
        block.kind === "table"
          ? block.rows.filter((row) => row.cells.length !== block.columns.length - 1).map((row) => `${doc.meta.slug}: ${row.label}`)
          : [],
      ),
    );

    expect(ragged).toEqual([]);
  });

  it("ends every guide with a round to play and at most one FAQ, reading list and source list", () => {
    const summary = LEARN_GUIDES.map((doc) => {
      const count = (kind: string) => doc.end.filter((block) => block.kind === kind).length;
      const game = doc.end.some((block) => block.kind === "cta" && block.target.kind === "game");
      return { slug: doc.meta.slug, game, faq: count("faq") <= 1, further: count("furtherReading") <= 1, sources: count("sources") <= 1 };
    });

    expect(summary.filter((entry) => !(entry.game && entry.faq && entry.further && entry.sources))).toEqual([]);
  });

  it("writes call-to-action reasons that no more than three guides share", () => {
    const sentences = new Map<string, Set<string>>();
    for (const doc of LEARN_GUIDES) {
      for (const block of [...blocks(doc), ...doc.end]) {
        if (block.kind !== "cta") continue;
        for (const sentence of block.why.split(/(?<=[.!?])\s+/)) {
          if (sentence.split(/\s+/).length < 5) continue;
          sentences.set(sentence, (sentences.get(sentence) ?? new Set()).add(doc.meta.slug));
        }
      }
    }

    expect([...sentences].filter(([, slugs]) => slugs.size > 3).map(([sentence]) => sentence)).toEqual([]);
  });

  it("never repeats the quick answer as a call-to-action reason", () => {
    const repeats = LEARN_GUIDES.filter((doc) => doc.end.some((block) => block.kind === "cta" && block.why === doc.intro.quickAnswer));

    expect(repeats.map((doc) => doc.meta.slug)).toEqual([]);
  });

  it("gives no guide a slug a /learn route already uses", () => {
    expect(LEARN_SLUGS.filter((slug) => RESERVED_LEARN_SLUGS.includes(slug))).toEqual([]);
    expect(RESERVED_LEARN_SLUGS.filter((slug) => !existsSync(join(process.cwd(), "src/app/[locale]/learn", slug, "page.tsx")))).toEqual([]);
  });

  it("lists a guide after the guide it tells readers to do first", () => {
    const order = groupPages(EN_LEARN_PAGES).flatMap(({ pages }) => pages.map((page) => page.meta.slug));

    expect(order.indexOf("chess-coordinates-practice")).toBeLessThan(order.indexOf("blindfold-chess-training-for-beginners"));
  });
});
