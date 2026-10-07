import { SHOWCASE } from "@/lib/home/showcase";
import { SHOWCASE_STEPS } from "@/lib/home/showcaseTour";
import { inspect, viewOfInspection, viewOfStep } from "@/lib/home/showcaseView";

describe("inspecting a piece", () => {
  it("lists the queen's moves, its capture and its mating check", () => {
    const queen = inspect("e4");
    expect(queen.color).toBe("white");
    expect(queen.captures).toEqual(["b4"]);
    expect(queen.moves).toContain("h7");
    expect(queen.moves).not.toContain("b4");
    expect(queen.checks).toEqual(["Qh7#"]);
  });

  it("reads Black's moves too", () => {
    expect(inspect("h8").moves).toEqual(["g8"]);
    expect(inspect("a7").checks).toEqual(["Qg1+"]);
  });

  it("marks the pieces a piece defends", () => {
    expect(inspect("e4").guards).toEqual(["e5", "g2"]);
  });

  it("reports a piece with nowhere to go", () => {
    expect(inspect("h1")).toMatchObject({ moves: [], captures: [], checks: [], guards: ["g2", "h2"] });
  });

  it("refuses an empty square", () => {
    expect(() => inspect("d4")).toThrow("d4");
  });
});

describe("the view of a moment", () => {
  it("shows circles only on study steps, and dims pieces only on threats", () => {
    const views = SHOWCASE_STEPS.map(viewOfStep);
    SHOWCASE_STEPS.forEach((step, index) => {
      expect(views[index].circles.length > 0).toBe(step.phase === "study" && step.circles.length > 0);
      expect(views[index].dimmed.length > 0).toBe(step.phase === "threat");
    });
  });

  it("blanks the board, then brings it back staggered, neither sliding", () => {
    const [blank, back] = SHOWCASE_STEPS.slice(-2).map(viewOfStep);
    expect(blank).toMatchObject({ hidden: true, staggered: false, glide: false });
    expect(back).toMatchObject({ hidden: false, staggered: true, glide: false });
  });

  it("returns an inspected piece's board to the study position", () => {
    const view = viewOfInspection(inspect("e4"));
    expect(view.placements.e4).toBe("e4");
    expect(view.annotations.focus).toBe("e4");
    expect(view.inspection?.source).toBe("e4");
    expect(Object.keys(view.placements)).toHaveLength(Object.keys(SHOWCASE.position).length);
  });
});
