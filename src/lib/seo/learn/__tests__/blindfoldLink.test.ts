import guide from "../guides/blindfold-chess-training-for-beginners";
import { ctaHref, guideRoundHref } from "../links";

describe("the blindfold guide's game link", () => {
  it("opens a blindfold round, while the stage-one drill still opens a board round", () => {
    const hrefs = guide.end.flatMap((block) => (block.kind === "cta" && block.target.kind === "game" ? [ctaHref(block.target)] : []));
    const drills = guide.sections.flatMap((section) => section.blocks).flatMap((block) => (block.kind === "drills" ? block.drills : []));

    expect(hrefs).toEqual(["/game?pieceCount=2&memorizeTime=10&from=guide_cta&mode=blindfold"]);
    expect(drills.flatMap((drill) => (drill.play ? [guideRoundHref(drill.play)] : []))).toEqual(["/game?pieceCount=2&memorizeTime=10&from=guide_cta"]);
  });
});
