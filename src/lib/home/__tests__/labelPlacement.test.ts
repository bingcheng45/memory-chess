import type { SquareName } from "@/lib/game/board";
import { SHOWCASE } from "@/lib/home/showcase";
import { SHOWCASE_STEPS } from "@/lib/home/showcaseTour";
import { SPECIMEN_GROUPS, SPECIMEN, SPECIMEN_RECALL } from "@/lib/home/specimen";
import { coveredSquares, placeLabel, squaresBox, type Size } from "@/lib/home/labelPlacement";

const occupiedOf = (position: Readonly<Partial<Record<SquareName, unknown>>>) => new Set(Object.keys(position) as SquareName[]);

describe("placing a group label", () => {
  it("keeps the white corner label off the bishop on f5", () => {
    const size: Size = { width: 2.5, height: 0.36 };
    const group = SHOWCASE.groups.find((g) => g.id === "whiteCorner")!;
    const rect = placeLabel(squaresBox(group.squares), size, occupiedOf(SHOWCASE.position));
    expect(coveredSquares(rect, occupiedOf(SHOWCASE.position))).toEqual([]);
    expect(rect.x).toBeGreaterThanOrEqual(0);
    expect(rect.x + size.width).toBeLessThanOrEqual(8);
    expect(rect.y).toBeGreaterThanOrEqual(0);
    expect(rect.y + size.height).toBeLessThanOrEqual(8);
  });

  it("prefers above the box when nothing is there", () => {
    const rect = placeLabel(squaresBox(["d4"]), { width: 1, height: 0.36 }, new Set<SquareName>(["d4"]));
    expect(rect.y).toBeLessThan(squaresBox(["d4"]).y);
    expect(rect.x).toBe(squaresBox(["d4"]).x);
  });

  it("never leaves the board, even for a wide label on the right edge", () => {
    const rect = placeLabel(squaresBox(["h5"]), { width: 3, height: 0.36 }, new Set<SquareName>(["h5"]));
    expect(rect.x + 3).toBeLessThanOrEqual(8);
  });

  it("clears every piece for every group of every hero study step", () => {
    const widths: Record<string, number> = { whiteCorner: 2.7, longDiagonal: 2.9, blackWall: 2.3, runner: 1.4 };
    SHOWCASE_STEPS.forEach((step) => {
      const occupied = new Set(
        Object.entries(step.boards[step.boards.length - 1].placements)
          .filter(([home]) => !step.boards[step.boards.length - 1].gone.includes(home as SquareName))
          .map(([, square]) => square as SquareName),
      );
      SHOWCASE.groups.forEach((group) => {
        const size = { width: widths[group.id], height: 0.36 };
        const rect = placeLabel(squaresBox(group.squares), size, occupied);
        expect(coveredSquares(rect, occupied)).toEqual([]);
        expect(rect.x).toBeGreaterThanOrEqual(0);
        expect(rect.x + size.width).toBeLessThanOrEqual(8);
        expect(rect.y).toBeGreaterThanOrEqual(0);
        expect(rect.y + size.height).toBeLessThanOrEqual(8);
      });
    });
  });

  it("clears the specimen and the recall for every microscope group", () => {
    [SPECIMEN, { ...SPECIMEN, ...SPECIMEN_RECALL }].forEach((position) => {
      const occupied = occupiedOf(position);
      SPECIMEN_GROUPS.forEach((group) => {
        const rect = placeLabel(squaresBox(group.squares), { width: 2.2, height: 0.36 }, occupied);
        expect(coveredSquares(rect, occupied)).toEqual([]);
      });
    });
  });
});
