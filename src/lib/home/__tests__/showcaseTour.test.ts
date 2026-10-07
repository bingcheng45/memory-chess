import { SHOWCASE } from "@/lib/home/showcase";
import { SHOWCASE_STEPS, buildShowcaseSteps, type ShowcaseStep } from "@/lib/home/showcaseTour";

const phaseOf = (phase: ShowcaseStep["phase"]) => SHOWCASE_STEPS.filter((step) => step.phase === phase);

describe("the showcase tour", () => {
  it("runs study, threats, finish, rebuild in that order", () => {
    const order = SHOWCASE_STEPS.map((step) => step.phase);
    expect(order).toEqual([
      ...Array(7).fill("study"),
      ...Array(3).fill("threat"),
      ...Array(2).fill("finish"),
      ...Array(2).fill("rebuild"),
    ]);
  });

  it("opens on the full position with nothing circled, then circles six groups one at a time", () => {
    const study = phaseOf("study");
    expect(study[0]).toMatchObject({ circles: [], active: null });
    const groups = study.slice(1);
    expect(groups.map((step) => (step.phase === "study" ? step.circles.length : 0))).toEqual([1, 2, 3, 4, 5, 6]);
    groups.forEach((step, index) => {
      if (step.phase !== "study") return;
      expect(step.active).toBe(SHOWCASE.groups[index].id);
      expect(step.circles).toEqual(SHOWCASE.groups.slice(0, index + 1).map((group) => group.id));
    });
  });

  it("lasts 37.1 seconds", () => {
    expect(SHOWCASE_STEPS.reduce((sum, step) => sum + step.durationMs, 0)).toBe(37_100);
  });

  it("ends on the rebuild, blank first, then every piece back", () => {
    expect(SHOWCASE_STEPS.slice(-2).map((step) => step.phase === "rebuild" && step.revealed)).toEqual([false, true]);
  });

  it("dims every piece the threat is not about", () => {
    const [knight] = phaseOf("threat");
    if (knight.phase !== "threat") throw new Error("expected a threat step");
    expect(knight.dimmed).toHaveLength(12);
    expect(knight.dimmed).not.toContain("f8");
    expect(knight.dimmed).not.toContain("h8");
  });

  it("slides the queens for the finish and leaves them put while the board blanks", () => {
    const [reply, checkmate] = phaseOf("finish");
    expect(reply.placements.a7).toBe("e3");
    expect(checkmate.placements).toMatchObject({ a7: "e3", e4: "h7" });
    const [blank, back] = phaseOf("rebuild");
    expect(blank.placements).toEqual(checkmate.placements);
    expect(back.placements.a7).toBe("a7");
    expect(back.placements.e4).toBe("e4");
  });

  it("counts each phase from one, and numbers steps with a counter only", () => {
    const counted = SHOWCASE_STEPS.filter((step) => step.ordinal);
    expect(counted).toHaveLength(11);
    expect(phaseOf("threat").map((step) => step.ordinal)).toEqual([
      { n: 1, of: 3 },
      { n: 2, of: 3 },
      { n: 3, of: 3 },
    ]);
  });

  it("gives every step its own copy key", () => {
    const keys = SHOWCASE_STEPS.map((step) => step.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("builds the same list from the same data", () => {
    expect(buildShowcaseSteps(SHOWCASE)).toEqual(SHOWCASE_STEPS);
  });
});
