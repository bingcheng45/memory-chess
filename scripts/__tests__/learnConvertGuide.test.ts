/** @jest-environment node */

import { convertGuide, type LegacyGuide, type LegacyPosition } from "../learn/convertGuide";

const base = {
  h1: "h1",
  primaryKeyword: "primary",
  secondaryKeywords: ["second"],
  keyTakeaways: ["One takeaway."],
  whoThisIsFor: ["One reader."],
  publishedAt: "2026-03-24T00:00:00.000Z",
  updatedAt: "2026-09-15T00:00:00.000Z",
};

describe("convertGuide", () => {
  it("splits prose around a placed board, keeps undrawn positions as section facts and drops FAQ-repeat questions", () => {
    const guide: LegacyGuide = {
      ...base,
      slug: "how-to-stop-blundering-in-chess",
      title: "How to Stop Blundering in Chess",
      description: "Why pieces drop.",
      ctaLabel: "Play 6 pieces with 10 seconds to look",
      quickAnswer: "Scan first.",
      difficulty: "Beginner",
      featured: true,
      sections: [
        {
          id: "puzzle-vs-game",
          title: "Why pieces drop in games",
          blocks: [
            { kind: "paragraphs", paragraphs: ["P0", "P1", "P2"] },
            {
              kind: "drills",
              drills: [
                {
                  title: "No seventh piece",
                  description: "Count first.",
                  duration: "4 rounds",
                  goal: "See it.",
                  ctaLabel: "Play 6 pieces, 10 seconds",
                  setup: { pieceCount: 6, memorizeTime: 10 },
                },
                { title: "Inventory", description: "At a board.", duration: "5 minutes", goal: "Circle zeros.", ctaLabel: "Take the inventory" },
              ],
            },
          ],
        },
      ],
      faq: [{ question: "Why do I blunder more in games than in puzzles?", answer: "A." }],
      relatedArticles: [{ slug: "how-to-see-the-whole-board-in-chess", reason: "Forgotten pieces." }],
      sources: [],
    };
    const positions: LegacyPosition[] = [
      { id: "phantom", sectionId: "puzzle-vs-game", white: ["Bb5"], black: ["Ke8"], claims: [{ kind: "noCheck" }] },
      { id: "undrawn", sectionId: "puzzle-vs-game", line: ["e4"], claims: [{ kind: "check" }] },
    ];

    const doc = convertGuide(guide, positions, {
      group: "board-vision",
      questions: ["How do I stop blundering pieces?", "Why do I blunder more in games than in puzzles?", "What is a loose piece?"],
      gameWhy: "Count before you submit.",
      boards: { "puzzle-vs-game": [{ position: "phantom", after: 1, caption: "The pin.", marks: [{ square: "b5", kind: "ring" }] }] },
    });

    expect(doc).toEqual({
      meta: {
        slug: "how-to-stop-blundering-in-chess",
        title: "How to Stop Blundering in Chess",
        h1: "h1",
        description: "Why pieces drop.",
        group: "board-vision",
        level: "beginner",
        publishedAt: "2026-03-24T00:00:00.000Z",
        updatedAt: "2026-09-15T00:00:00.000Z",
        questions: ["How do I stop blundering pieces?", "What is a loose piece?"],
        keywords: { primary: "primary", secondary: ["second"] },
        featured: true,
      },
      intro: { quickAnswer: "Scan first.", takeaways: ["One takeaway."], audience: ["One reader."] },
      sections: [
        {
          id: "puzzle-vs-game",
          heading: "Why pieces drop in games",
          blocks: [
            { kind: "prose", paragraphs: ["P0", "P1"] },
            {
              kind: "board",
              position: { id: "phantom", white: ["Bb5"], black: ["Ke8"], claims: [{ kind: "noCheck" }] },
              marks: [{ square: "b5", kind: "ring" }],
              caption: "The pin.",
            },
            { kind: "prose", paragraphs: ["P2"] },
            {
              kind: "drills",
              drills: [
                {
                  title: "No seventh piece",
                  description: "Count first.",
                  duration: "4 rounds",
                  goal: "See it.",
                  play: { label: "Play 6 pieces, 10 seconds", pieceCount: 6, memorizeTime: 10 },
                },
                { title: "Inventory", description: "At a board.", duration: "5 minutes", goal: "Circle zeros." },
              ],
            },
          ],
          facts: [{ id: "undrawn", line: ["e4"], claims: [{ kind: "check" }] }],
        },
      ],
      end: [
        {
          kind: "cta",
          target: { kind: "game", label: "Play 6 pieces with 10 seconds to look", pieceCount: 6, memorizeTime: 10 },
          why: "Count before you submit.",
        },
        { kind: "faq", items: [{ question: "Why do I blunder more in games than in puzzles?", answer: "A." }] },
        { kind: "furtherReading", items: [{ kind: "guide", slug: "how-to-see-the-whole-board-in-chess", reason: "Forgotten pieces." }] },
      ],
    });
  });

  it("maps plans, comparisons, inline links, article and stat calls to action, and sources", () => {
    const guide: LegacyGuide = {
      ...base,
      slug: "20-minute-daily-chess-study-plan",
      title: "20-Minute Daily Chess Study Plan for Beginners",
      description: "Old description.",
      ctaLabel: "Play 6 pieces, 10 seconds",
      quickAnswer: "Minutes 0 to 3.",
      difficulty: "Beginner to Intermediate",
      keyTakeaways: undefined,
      sections: [
        {
          id: "timetable",
          title: "The timetable",
          summary: "Four blocks.",
          blocks: [
            { kind: "plan", steps: [{ label: "Minutes 0 to 3", duration: "3 minutes", detail: "Three rounds." }] },
            { kind: "paragraphs", paragraphs: ["Open the settings page now."], link: { phrase: "the settings page", href: "/settings" } },
            { kind: "comparison", columns: ["Skill", "Struggling", "Stronger"], rows: [{ label: "Recall", struggling: "Two", stronger: "Six" }] },
            { kind: "steps", ordered: true, items: ["First."] },
            { kind: "callout", title: "Why", body: "Because." },
            {
              kind: "drills",
              drills: [
                {
                  title: "Warm-up",
                  description: "Play 6 pieces.",
                  duration: "about 3 minutes",
                  goal: "Clean.",
                  ctaLabel: "Play 6 pieces, 10 seconds",
                  setup: { pieceCount: 6, memorizeTime: 10 },
                },
              ],
            },
          ],
        },
      ],
      faq: [],
      relatedArticles: [{ slug: "how-many-chess-puzzles-a-day", reason: "Counts." }],
      furtherReading: [{ slug: "judit-polgar", anchor: "how Judit Polgár played blindfold" }],
      sources: [{ title: "Spacing study", url: "https://example.org/spacing", note: "Verbal recall." }],
    };

    const doc = convertGuide(guide, [], {
      group: "practice",
      description: "New description.",
      questions: ["What is a good daily chess routine?", "How do I study chess with little time?"],
      gameWhy: "First block.",
      articles: { "judit-polgar": { label: "Judit Polgár", why: "Read it." } },
      extraCtas: [{ kind: "cta", target: { kind: "stat", tile: "days", label: "Count your days played" }, why: "Days played." }],
    });

    expect(doc.meta.description).toBe("New description.");
    expect(doc.meta.level).toBe("improver");
    expect(doc.meta).not.toHaveProperty("featured");
    expect(doc.intro.takeaways).toEqual([]);
    expect(doc.sections).toEqual([
      {
        id: "timetable",
        heading: "The timetable",
        summary: "Four blocks.",
        blocks: [
          { kind: "plan", steps: [{ label: "Minutes 0 to 3", duration: "3 minutes", detail: "Three rounds." }] },
          { kind: "prose", paragraphs: [["Open ", { text: "the settings page", href: "/settings" }, " now."]] },
          { kind: "table", columns: ["Skill", "Struggling", "Stronger"], rows: [{ label: "Recall", cells: ["Two", "Six"] }] },
          { kind: "list", ordered: true, items: ["First."] },
          { kind: "takeaway", title: "Why", body: "Because." },
          {
            kind: "drills",
            drills: [
              {
                title: "Warm-up",
                description: "Play 6 pieces.",
                duration: "about 3 minutes",
                goal: "Clean.",
                play: { label: "Play 6 pieces, 10 seconds", pieceCount: 6, memorizeTime: 10 },
              },
            ],
          },
        ],
      },
    ]);
    expect(doc.end).toEqual([
      { kind: "cta", target: { kind: "game", label: "Play 6 pieces, 10 seconds", pieceCount: 6, memorizeTime: 10 }, why: "First block." },
      { kind: "cta", target: { kind: "stat", tile: "days", label: "Count your days played" }, why: "Days played." },
      { kind: "cta", target: { kind: "article", slug: "judit-polgar", label: "Judit Polgár" }, why: "Read it." },
      { kind: "furtherReading", items: [{ kind: "guide", slug: "how-many-chess-puzzles-a-day", reason: "Counts." }] },
      { kind: "sources", items: [{ title: "Spacing study", url: "https://example.org/spacing", note: "Verbal recall." }] },
    ]);
  });

  it("refuses a guide with no round to play", () => {
    const guide: LegacyGuide = {
      ...base,
      slug: "no-round",
      title: "t",
      description: "d",
      ctaLabel: "c",
      quickAnswer: "q",
      difficulty: "Beginner",
      sections: [{ id: "s", title: "S", blocks: [{ kind: "paragraphs", paragraphs: ["p"] }] }],
      faq: [],
      relatedArticles: [{ slug: "x", reason: "r" }],
      sources: [],
    };

    expect(() => convertGuide(guide, [], { group: "practice", questions: ["A?", "B?"], gameWhy: "w" })).toThrow(
      "no-round has no round to play",
    );
  });
});
