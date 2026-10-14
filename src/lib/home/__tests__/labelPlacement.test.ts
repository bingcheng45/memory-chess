import type { SquareName } from "@/lib/game/board";
import { linesOf, SHOWCASE } from "@/lib/home/showcase";
import { SHOWCASE_STEPS } from "@/lib/home/showcaseTour";
import { SPECIMEN_GROUPS, SPECIMEN, SPECIMEN_RECALL } from "@/lib/home/specimen";
import {
  coveredSquares,
  coveredLength,
  placeLabel,
  segmentBetween,
  squaresBox,
  type Segment,
  type Size,
} from "@/lib/home/labelPlacement";

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

  describe("keeping off the arrows drawn in the same step", () => {
    const widths: Record<string, number> = { whiteCorner: 2.7, longDiagonal: 2.9, blackWall: 2.3, runner: 1.4 };
    const heroArrows = (step: (typeof SHOWCASE_STEPS)[number]): Segment[] => [
      ...linesOf(step.annotations).map((line) => segmentBetween(line.from, line.to)),
    ];
    const heroOccupied = (step: (typeof SHOWCASE_STEPS)[number]) => {
      const board = step.boards[step.boards.length - 1];
      return new Set(
        Object.entries(board.placements)
          .filter(([home]) => !board.gone.includes(home as SquareName))
          .map(([, square]) => square as SquareName),
      );
    };

    it("moves the Long diagonal pill off the c3 to f6 arrow in the group step", () => {
      const step = SHOWCASE_STEPS.find((s) => s.key === "study.longDiagonal")!;
      const group = SHOWCASE.groups.find((g) => g.id === "longDiagonal")!;
      const size = { width: widths.longDiagonal, height: 0.36 };
      const arrows = heroArrows(step);
      const rect = placeLabel(squaresBox(group.squares), size, heroOccupied(step), arrows);
      expect(coveredSquares(rect, heroOccupied(step))).toEqual([]);
      expect(coveredLength(rect, arrows)).toBe(0);
    });

    it("trades an arrow for a piece never: pieces stay the first priority", () => {
      const occupied = new Set<SquareName>(["d4", "d6", "b4", "f4", "d3"]);
      const arrows = [segmentBetween("d2", "d7")];
      const rect = placeLabel(squaresBox(["d4"]), { width: 1, height: 0.36 }, occupied, arrows);
      expect(coveredSquares(rect, occupied)).toEqual([]);
    });

    it("clears every piece and every arrow for each group's pill, in the step that shows it", () => {
      SHOWCASE_STEPS.forEach((step) => {
        const occupied = heroOccupied(step);
        const arrows = heroArrows(step);
        const shown = SHOWCASE.groups.filter((group) => step.phase === "study" && step.active === group.id);
        shown.forEach((group) => {
          const size = { width: widths[group.id], height: 0.36 };
          const rect = placeLabel(squaresBox(group.squares), size, occupied, arrows);
          expect(coveredSquares(rect, occupied)).toEqual([]);
          expect(coveredLength(rect, arrows)).toBeLessThan(0.0001);
        });
      });
    });

    it("clears every piece and every arrow for every microscope group", () => {
      const allArrows = SPECIMEN_GROUPS.flatMap((g) => g.relations)
        .filter((item) => item.kind !== "blocked")
        .map((item) => segmentBetween(item.from, item.to));
      [SPECIMEN, { ...SPECIMEN, ...SPECIMEN_RECALL }].forEach((position) => {
        const occupied = occupiedOf(position);
        SPECIMEN_GROUPS.forEach((group) => {
          const rect = placeLabel(squaresBox(group.squares), { width: 2.2, height: 0.36 }, occupied, allArrows);
          expect(coveredSquares(rect, occupied)).toEqual([]);
          expect(coveredLength(rect, allArrows)).toBeLessThan(0.0001);
        });
      });
    });
  });
});
