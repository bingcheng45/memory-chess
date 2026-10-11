import { SHOWCASE } from "@/lib/home/showcase";
import { SHOWCASE_STEPS, buildShowcaseSteps, type ShowcaseStep } from "@/lib/home/showcaseTour";

const phaseOf = (phase: ShowcaseStep["phase"]) => SHOWCASE_STEPS.filter((step) => step.phase === phase);
const stepOf = (key: string) => SHOWCASE_STEPS.find((step) => step.key === key)!;

describe("the showcase tour", () => {
  it("runs study, the trap, the game, then the rebuild", () => {
    expect(SHOWCASE_STEPS.map((step) => step.key)).toEqual([
      "study.intro",
      "study.whiteCorner",
      "study.longDiagonal",
      "study.blackWall",
      "study.runner",
      "trap.king",
      "game.sacrifice",
      "game.walk",
      "game.runners",
      "rebuild.blank",
      "rebuild.back",
      "rebuild.check",
    ]);
  });

  it("opens on the full position with nothing circled, then circles four groups one at a time", () => {
    const study = phaseOf("study");
    expect(study[0]).toMatchObject({ circles: [], active: null });
    study.slice(1).forEach((step, index) => {
      if (step.phase !== "study") throw new Error("expected a study step");
      expect(step.active).toBe(SHOWCASE.groups[index].id);
      expect(step.circles).toEqual(SHOWCASE.groups.slice(0, index + 1).map((group) => group.id));
      expect(step.annotations.relations).toEqual(SHOWCASE.groups[index].relations);
    });
  });

  it("plays the game one board per ply: one for the sacrifice, four for the walk, eight for the runners", () => {
    expect(phaseOf("game").map((step) => step.boards.length)).toEqual([1, 4, 8]);
  });

  it("gives a stretch of the game a second per ply, then time to read", () => {
    expect(stepOf("game.walk").durationMs).toBe(4 * 1000 + 2800);
    expect(SHOWCASE_STEPS.reduce((sum, step) => sum + step.durationMs, 0)).toBe(45_600);
  });

  it("takes the bishop on h3 and the pawn on f6 off the board as they fall", () => {
    const walk = stepOf("game.walk");
    expect(walk.boards[0].gone).toEqual(["f5"]);
    expect(walk.boards[0].placements.g2).toBe("h3");
    const runners = stepOf("game.runners");
    expect(runners.boards[0].gone).toEqual(["f5", "f6"]);
    expect(runners.boards.at(-1)!.placements).toMatchObject({ e6: "b3", c3: "e7", d5: "d4", a4: "a4" });
  });

  it("dims every piece the trap is not about", () => {
    const trap = stepOf("trap.king");
    if (trap.phase !== "trap") throw new Error("expected the trap");
    expect([...trap.dimmed].sort()).toEqual(["a4", "g1", "g2", "g6", "h4"]);
  });

  it("blanks the board where the game ended, then puts every piece back on its study square", () => {
    const [blank, back, check] = phaseOf("rebuild");
    expect(blank.boards).toEqual(stepOf("game.runners").boards.slice(-1));
    expect(back.boards[0]).toEqual(SHOWCASE_STEPS[0].boards[0]);
    expect(back.boards[0].gone).toEqual([]);
    expect(check.annotations.ticks).toEqual(["c3", "f5", "f6"]);
    expect(phaseOf("rebuild").map((step) => step.phase === "rebuild" && step.revealed)).toEqual([false, true, true]);
  });

  it("counts the study groups and the stretches of the game, and nothing else", () => {
    expect(SHOWCASE_STEPS.map((step) => step.ordinal && `${step.ordinal.n}/${step.ordinal.of}`)).toEqual([
      null,
      "1/4",
      "2/4",
      "3/4",
      "4/4",
      null,
      "1/3",
      "2/3",
      "3/3",
      null,
      null,
      null,
    ]);
  });

  it("builds the same list from the same data", () => {
    expect(buildShowcaseSteps(SHOWCASE)).toEqual(SHOWCASE_STEPS);
  });
});
