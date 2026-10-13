/** @jest-environment node */

import type { SquareName } from "@/lib/game/board";
import { LINE_GRAMMAR, LINE_KINDS, type BoardLine } from "@/lib/home/lineGrammar";
import { linesOf, SHOWCASE } from "@/lib/home/showcase";
import { MICROSCOPE_PHASES, SPECIMEN, SPECIMEN_RECALL } from "@/lib/home/specimen";
import { lineGeometry } from "../BoardLine";

const round = (value: number) => Math.round(value * 1000) / 1000;
const point = ({ x, y }: { x: number; y: number }) => [round(x), round(y)];
const occupiedBy = (squares: readonly string[]) => new Set(squares as SquareName[]);

describe("board line geometry", () => {
  it("runs from an empty square's centre to the edge of the piece it points at", () => {
    const { shaft, head } = lineGeometry({ kind: "move", from: "f5", to: "h3" }, occupiedBy(["h3"]));
    expect(point(shaft[0])).toEqual([5.5, 3.5]);
    expect(point(head![0])).toEqual([round(7.5 - 0.36 / Math.SQRT2), round(5.5 - 0.36 / Math.SQRT2)]);
  });

  it("ends on the target square's centre when nothing stands there", () => {
    const { shaft, head } = lineGeometry({ kind: "path", from: "a4", to: "a1" }, occupiedBy(["a4"]));
    expect(point(shaft[0])).toEqual([0.5, 4.86]);
    expect(point(head![0])).toEqual([0.5, 7.5]);
  });

  it("draws a link without a head and a blocked pair as a bar on the shared border", () => {
    const chain = lineGeometry({ kind: "chain", from: "h2", to: "g3" }, occupiedBy(["h2", "g3"]));
    expect(chain.head).toBeNull();
    const blocked = lineGeometry({ kind: "blocked", from: "f4", to: "f5" }, occupiedBy(["f4", "f5"]));
    expect(point(blocked.shaft[1])).toEqual([5.5, 4]);
    expect(blocked.bar!.map(point)).toEqual([
      [5.8, 4],
      [5.2, 4],
    ]);
  });

  it("gives every kind a look, and the legend lists every kind once", () => {
    expect([...LINE_KINDS].sort()).toEqual(Object.keys(LINE_GRAMMAR).sort());
  });
});

/** Squares a line's drawn stroke passes within `radius` of, other than its own ends' gaps. */
function coveredPieces(line: BoardLine, pieces: ReadonlySet<SquareName>): string[] {
  const { shaft, head } = lineGeometry(line, pieces);
  const tip = head ? head[0] : shaft[1];
  const samples = Array.from({ length: 41 }, (_, i) => ({
    x: shaft[0].x + ((tip.x - shaft[0].x) * i) / 40,
    y: shaft[0].y + ((tip.y - shaft[0].y) * i) / 40,
  }));
  return [...pieces].filter((square) => {
    const cx = "abcdefgh".indexOf(square[0]) + 0.5;
    const cy = 8 - Number(square[1]) + 0.5;
    return samples.some(({ x, y }) => Math.hypot(x - cx, y - cy) < 0.3);
  });
}

describe("every line on the home page", () => {
  it("keeps clear of every piece glyph on its board", () => {
    const hero = [SHOWCASE.trap, SHOWCASE.check, ...SHOWCASE.scenes.map((scene) => scene.annotations)];
    const studyPieces = occupiedBy(Object.keys(SHOWCASE.position));
    const studyLines = [...SHOWCASE.groups.flatMap((group) => group.relations), ...linesOf(SHOWCASE.trap), ...linesOf(SHOWCASE.check)];
    expect(studyLines.flatMap((line) => coveredPieces(line, studyPieces))).toEqual([]);
    expect(hero.length).toBeGreaterThan(0);

    const specimenPieces = occupiedBy(Object.keys(SPECIMEN));
    const recallPieces = occupiedBy(Object.keys(SPECIMEN_RECALL));
    const scope = MICROSCOPE_PHASES.flatMap((phase) => [
      ...phase.relations.flatMap((line) => coveredPieces(line, specimenPieces)),
      ...phase.checks.flatMap((check) => coveredPieces(check.relation, recallPieces)),
    ]);
    expect(scope).toEqual([]);
  });
});
