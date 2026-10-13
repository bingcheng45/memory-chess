import { EN_LEARN_PAGES as LEARN_PAGES, type Drill, type LearnPage } from "@/lib/seo/learn";
import { blockText, richText } from "@/lib/seo/learn/text";
import { MEMORIZE_SECONDS_RANGE, PIECE_COUNT_RANGE } from "@/lib/reference/facts";

function drillsOf(page: LearnPage): Drill[] {
  return page.sections.flatMap((section) => section.blocks).flatMap((block) => (block.kind === "drills" ? block.drills : []));
}

function visibleCopy(page: LearnPage): string[] {
  return [
    page.meta.title,
    page.meta.h1,
    page.meta.description,
    page.intro.quickAnswer,
    ...page.intro.takeaways,
    ...page.intro.audience,
    ...page.sections.flatMap((section) => [section.heading, section.summary ?? "", ...section.blocks.flatMap(blockText)]),
    ...page.end.flatMap(blockText),
  ].filter(Boolean);
}

describe("learnPages registry", () => {
  it("returns unique slugs including the cluster pages", () => {
    const slugs = LEARN_PAGES.map((page) => page.meta.slug);

    expect(slugs).toContain("how-to-stop-blundering-in-chess");
    expect(slugs).toContain("why-puzzle-rating-doesnt-transfer-to-games");
    expect(slugs).toContain("20-minute-daily-chess-study-plan");
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("features four guides", () => {
    expect(LEARN_PAGES.filter((page) => page.meta.featured).map((page) => page.meta.slug)).toEqual([
      "how-to-get-better-at-chess-for-beginners",
      "how-to-stop-blundering-in-chess",
      "chess-visualization-exercises",
      "chess-memory-training",
    ]);
  });

  it("keeps every published guide in clear, reader-facing language", () => {
    const difficultInternalPhrases = [
      "primary keyword",
      "search intent",
      "content cluster",
      "rich-result",
      "candidate line",
      "transfer layer",
      "internal board model",
      "progressive deprivation",
      "false fix",
    ];

    const problems = LEARN_PAGES.flatMap((page) => {
      const copy = visibleCopy(page);
      const combined = copy.join(" ").toLowerCase();
      const longSentences = copy
        .flatMap((value) => value.split(/[.!?]+/).map((sentence) => sentence.trim()))
        .filter((sentence) => sentence.split(/\s+/).length > 28);
      return [
        ...difficultInternalPhrases.filter((phrase) => combined.includes(phrase)).map((phrase) => `${page.meta.slug}: ${phrase}`),
        ...longSentences.map((sentence) => `${page.meta.slug}: ${sentence}`),
      ];
    });

    expect(problems).toEqual([]);
  });

  it("describes every played drill with the numbers of the round it opens", () => {
    const wrong = LEARN_PAGES.flatMap(drillsOf).flatMap((drill) => {
      if (!drill.play) return [];
      const { pieceCount, memorizeTime, label } = drill.play;
      const inRange =
        pieceCount >= PIECE_COUNT_RANGE.min &&
        pieceCount <= PIECE_COUNT_RANGE.max &&
        memorizeTime >= MEMORIZE_SECONDS_RANGE.min &&
        memorizeTime <= MEMORIZE_SECONDS_RANGE.max;
      const named = [richText(drill.description), label].every(
        (copy) => copy.includes(`${pieceCount} pieces`) && copy.includes(`${memorizeTime} seconds`),
      );
      return inRange && named ? [] : [drill.title];
    });

    expect(LEARN_PAGES.flatMap(drillsOf).filter((drill) => drill.play)).toHaveLength(21);
    expect(wrong).toEqual([]);
  });
});
