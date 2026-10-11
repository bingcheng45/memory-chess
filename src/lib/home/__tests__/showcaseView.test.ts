import { SHOWCASE } from "@/lib/home/showcase";
import { SHOWCASE_STEPS } from "@/lib/home/showcaseTour";
import { inspect, viewOfInspection, viewOfStep } from "@/lib/home/showcaseView";

const stepOf = (key: string) => SHOWCASE_STEPS.find((step) => step.key === key)!;

describe("inspecting a piece", () => {
  it("lists the bishop's moves and its capture on f6", () => {
    const bishop = inspect("c3");
    expect(bishop.color).toBe("white");
    expect(bishop.captures).toEqual(["f6"]);
    expect(bishop.moves).toEqual(["b4", "a5", "d4", "e5", "d2", "e1", "b2", "a1"]);
    expect(bishop.checks).toEqual([]);
  });

  it("shows the black king boxed in: four moves, none forward", () => {
    expect([...inspect("e6").moves].sort()).toEqual(["d6", "d7", "e7", "f7"]);
  });

  it("marks the pieces a piece defends", () => {
    expect(inspect("e6").guards).toEqual(["d5", "f5", "f6"]);
    expect(inspect("g1").guards).toEqual(["g2"]);
  });

  it("refuses an empty square", () => {
    expect(() => inspect("d4")).toThrow("d4");
  });
});

describe("the view of a moment", () => {
  it("shows circles only on study steps, and dims pieces only in the trap", () => {
    SHOWCASE_STEPS.forEach((step) => {
      const view = viewOfStep(step);
      expect(view.circles.length > 0).toBe(step.phase === "study" && step.circles.length > 0);
      expect(view.dimmed.length > 0).toBe(step.phase === "trap");
    });
  });

  it("walks a stretch of the game board by board, and draws its marks only on the last", () => {
    const walk = stepOf("game.walk");
    const first = viewOfStep(walk, 0);
    const last = viewOfStep(walk, 3);
    expect(first.board.placements.e6).toBe("e6");
    expect(first.board.placements.g2).toBe("h3");
    expect(first.annotations.moves).toEqual([]);
    expect(last.board.placements.e6).toBe("e4");
    expect(last.annotations.moves).toHaveLength(2);
    expect(viewOfStep(walk)).toEqual(last);
  });

  it("blanks the board, then brings it back staggered, neither sliding", () => {
    const [blank, back] = SHOWCASE_STEPS.slice(-3).map((step) => viewOfStep(step));
    expect(blank).toMatchObject({ hidden: true, staggered: false, glide: false });
    expect(back).toMatchObject({ hidden: false, staggered: true, glide: false });
  });

  it("returns an inspected piece's board to the study position", () => {
    const view = viewOfInspection(inspect("c3"));
    expect(view.board.placements.c3).toBe("c3");
    expect(view.board.gone).toEqual([]);
    expect(view.annotations.focus).toBe("c3");
    expect(view.inspection?.source).toBe("c3");
    expect(Object.keys(view.board.placements)).toHaveLength(Object.keys(SHOWCASE.position).length);
  });
});
