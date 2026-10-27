import { ROUND_SOURCES, roundSourceFrom } from "@/lib/analytics/events";
import { LEARN_GUIDES } from "../guides";
import { guideTryHref } from "../links";
import { chessOf } from "../positions";
import { TRY_IT_PIECES, TRY_IT_POSITION } from "../tryIt";

const tryItOf = (slug: string) => LEARN_GUIDES.find((guide) => guide.meta.slug === slug)?.tryIt;

describe("the Try it here block's round link", () => {
  it("opens four pieces with the study time and the guide_try source", () => {
    expect(guideTryHref({ memorizeTime: 10 })).toBe("/game?pieceCount=4&memorizeTime=10&from=guide_try");
  });

  it("opens a blindfold round when the block is blindfold", () => {
    expect(guideTryHref({ memorizeTime: 15, blindfold: true })).toBe("/game?pieceCount=4&memorizeTime=15&from=guide_try&mode=blindfold");
  });

  it("registers guide_try as a round source the game page reads back", () => {
    expect(ROUND_SOURCES).toContain("guide_try");
    expect(roundSourceFrom("guide_try")).toBe("guide_try");
  });
});

describe("the Try it here position", () => {
  it("holds exactly four pieces, none giving check, so it matches the round it links to", () => {
    const chess = chessOf(TRY_IT_POSITION);

    expect(chess.board().flat().filter(Boolean)).toHaveLength(TRY_IT_PIECES);
    expect(TRY_IT_PIECES).toBe(4);
    expect(chess.isCheck()).toBe(false);
    expect(chess.turn()).toBe("w");
  });
});

describe("which guides carry the block", () => {
  it.each([
    ["blindfold-chess-training-for-beginners", { memorizeTime: 15, blindfold: true }],
    ["chess-calculation-exercises-for-beginners", { memorizeTime: 10 }],
    ["how-to-get-better-at-chess-for-beginners", { memorizeTime: 10 }],
  ])("%s has a Try it block of %j", (slug, expected) => {
    expect(tryItOf(slug)).toEqual(expected);
  });

  it("is on those three guides only", () => {
    expect(LEARN_GUIDES.filter((guide) => guide.tryIt).map((guide) => guide.meta.slug).sort()).toEqual([
      "blindfold-chess-training-for-beginners",
      "chess-calculation-exercises-for-beginners",
      "how-to-get-better-at-chess-for-beginners",
    ]);
  });
});

describe("the whole-board guide's first drill", () => {
  const drills = LEARN_GUIDES.find((guide) => guide.meta.slug === "how-to-see-the-whole-board-in-chess")!
    .sections.flatMap((section) => section.blocks)
    .flatMap((block) => (block.kind === "drills" ? block.drills : []));

  it("opens 6 pieces with 15 seconds to look, which a beginner can manage", () => {
    expect(drills[0].play).toEqual({ label: "Play 6 pieces, 15 seconds", pieceCount: 6, memorizeTime: 15 });
  });
});
