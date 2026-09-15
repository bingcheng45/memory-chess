import { LEARN_GUIDES } from "../guides";
import { LEARN_GOAL_IDS, type LearnGuide } from "../schema";

const DIFFICULTY_RANK: Record<LearnGuide["difficulty"], number> = {
  Beginner: 0,
  "Beginner to Intermediate": 1,
};

function slugsFor(goal: LearnGuide["goal"]): string[] {
  return LEARN_GUIDES.filter((guide) => guide.goal === goal).map((guide) => guide.slug);
}

describe("Learn guide order", () => {
  it("lists every goal's guides from easiest to hardest", () => {
    for (const goal of LEARN_GOAL_IDS) {
      const ranks = LEARN_GUIDES.filter((guide) => guide.goal === goal).map(
        (guide) => DIFFICULTY_RANK[guide.difficulty],
      );

      expect({ goal, ranks }).toEqual({ goal, ranks: [...ranks].sort((a, b) => a - b) });
    }
  });

  it("lists a guide after the guide it tells readers to do first", () => {
    // Blindfold stage one sends readers to the coordinates guide before they continue.
    const visualization = slugsFor("visualization");

    expect(visualization.indexOf("chess-coordinates-practice")).toBeLessThan(
      visualization.indexOf("blindfold-chess-training-for-beginners"),
    );
  });
});

describe("Learn inline links", () => {
  it("finds every linked phrase in the text it is attached to", () => {
    const missing = LEARN_GUIDES.flatMap((guide) =>
      guide.sections.flatMap((section) =>
        section.blocks.flatMap((block) => {
          if (block.kind === "paragraphs" && block.link) {
            const { phrase } = block.link;
            return block.paragraphs.some((paragraph) => paragraph.includes(phrase))
              ? []
              : [`${guide.slug}#${section.id}: "${phrase}"`];
          }
          if (block.kind === "drills") {
            return block.drills
              .filter((drill) => drill.link && !drill.description.includes(drill.link.phrase))
              .map((drill) => `${guide.slug}#${section.id} ${drill.title}: "${drill.link!.phrase}"`);
          }
          return [];
        }),
      ),
    );

    expect(missing).toEqual([]);
  });
});
