/** @jest-environment node */

import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { Chess, type Square } from "chess.js";
import type { SquareName } from "@/lib/game/board";
import { GROUP_INDEX, groupBounds, SHOWCASE } from "@/lib/home/showcase";
import { SHOWCASE_REACH } from "@/lib/home/showcaseReplay";

const occupied = Object.keys(SHOWCASE.position) as SquareName[];

describe("the groups", () => {
  it("bring the pieces back in group order", () => {
    expect(occupied.map((square) => GROUP_INDEX[square]).sort()).toEqual([0, 0, 0, 1, 2, 2, 2, 2, 2, 3]);
  });

  it("outline the smallest box that holds each group", () => {
    const bounds = Object.fromEntries(SHOWCASE.groups.map((group) => [group.id, groupBounds(group)]));
    expect(bounds).toEqual({
      whiteCorner: ["g1", "h4"],
      longDiagonal: ["c3", "c3"],
      blackWall: ["d5", "g6"],
      runner: ["a4", "a4"],
    });
  });
});

describe("the reach table", () => {
  it("agrees with chess.js for every piece", () => {
    const game = new Chess(SHOWCASE.fen);
    expect(Object.keys(SHOWCASE_REACH).sort()).toEqual([...occupied].sort());
    occupied.forEach((square) => {
      const color = SHOWCASE.position[square]!.color === "white" ? "w" : "b";
      const reach = SHOWCASE_REACH[square]!;
      reach.attacks.forEach((target) => expect(game.attackers(target as Square, color)).toContain(square));
      if (color === game.turn()) {
        const legal = game.moves({ square: square as Square, verbose: true }).map((move) => ({ to: move.to, san: move.san }));
        expect(reach.legal).toEqual(legal);
      }
    });
  });

  it("is the table the generator writes now", () => {
    const run = spawnSync(
      process.execPath,
      ["--disable-warning=MODULE_TYPELESS_PACKAGE_JSON", join("scripts", "generate-showcase-reach.mjs"), "--check"],
      { cwd: process.cwd(), encoding: "utf8" },
    );
    expect(run.stderr).toBe("");
    expect(run.status).toBe(0);
  });
});
