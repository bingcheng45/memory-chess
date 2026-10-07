/** @jest-environment node */

import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { Chess } from "chess.js";
import type { SquareName } from "@/lib/game/board";
import { GROUP_INDEX, SHOWCASE, squaresInBox, type SquareBox } from "@/lib/home/showcase";
import { BONN_MOVES } from "@/lib/home/showcaseGame";
import { SHOWCASE_REACH } from "@/lib/home/showcaseReach";

const replay = () => {
  const game = new Chess();
  BONN_MOVES.forEach((move) => game.move(move));
  return game;
};

const occupied = Object.keys(SHOWCASE.position) as SquareName[];
const reachOf = (square: SquareName) => SHOWCASE_REACH[square]!;

describe("the Bonn position", () => {
  it("is what the game record reaches, with Black to move", () => {
    const game = replay();
    expect(game.fen()).toBe(SHOWCASE.fen);
    expect(game.turn()).toBe("b");
    expect(occupied).toHaveLength(14);
  });

  it("matches the pieces chess.js puts on the board", () => {
    const fromEngine = replay()
      .board()
      .flat()
      .flatMap((cell) => (cell ? [`${cell.square} ${cell.color} ${cell.type}`] : []));
    const fromData = occupied.map((square) => {
      const piece = SHOWCASE.position[square]!;
      const letter = { king: "k", queen: "q", rook: "r", bishop: "b", knight: "n", pawn: "p" }[piece.type];
      return `${square} ${piece.color === "white" ? "w" : "b"} ${letter}`;
    });
    expect(fromData.sort()).toEqual(fromEngine.sort());
  });
});

describe("the six groups", () => {
  const holders = SHOWCASE.groups.map((group) => ({
    group,
    pieces: squaresInBox(group.box).filter((square) => SHOWCASE.position[square]),
  }));

  it("hold every piece exactly once", () => {
    const all = holders.flatMap(({ pieces }) => pieces);
    expect(all).toHaveLength(14);
    expect(new Set(all)).toEqual(new Set(occupied));
    expect(Object.keys(GROUP_INDEX).filter((square) => SHOWCASE.position[square as SquareName])).toHaveLength(14);
  });

  it("are never empty and keep to their side", () => {
    holders.forEach(({ group, pieces }) => {
      expect(pieces.length).toBeGreaterThan(0);
      if (group.side !== "mixed") {
        expect(pieces.every((square) => SHOWCASE.position[square]!.color === group.side)).toBe(true);
      }
    });
  });

  it("reads a box from its lower-left corner to its upper-right corner", () => {
    const box: SquareBox = ["f6", "h8"];
    expect(squaresInBox(box)).toHaveLength(9);
    expect(squaresInBox(["a7", "a7"])).toEqual(["a7"]);
  });
});

describe("what the captions claim", () => {
  it("has the knight on f8 and the queen on e4 both attacking h7", () => {
    expect(reachOf("f8").attacks).toContain("h7");
    expect(reachOf("e4").attacks).toContain("h7");
  });

  it("makes Qh7 mate, with the knight guarding the queen and the king boxed in by g7", () => {
    const mate = SHOWCASE.finish.mate;
    expect(reachOf(mate.from).legal).toContainEqual({ to: mate.to, san: "Qh7#" });
    expect(reachOf(mate.supporter).attacks).toContain(mate.to);
    expect(SHOWCASE.position.g7).toEqual({ color: "black", type: "pawn" });
  });

  it("lets 22 of Black's 26 legal moves allow Qh7#, and only Kg8, Qg1+, g6 and g5 stop it", () => {
    const game = replay();
    const blackMoves = game.moves();
    const allowing = blackMoves.filter((san) => {
      const after = replay();
      after.move(san);
      return after.moves().includes("Qh7#");
    });
    expect(blackMoves).toHaveLength(26);
    expect(allowing).toHaveLength(22);
    expect(blackMoves.filter((san) => !allowing.includes(san)).sort()).toEqual(["Kg8", "Qg1+", "g5", "g6"]);
  });

  it("is checkmate after 34...Qe3 35.Qh7#, with g8 covered", () => {
    const game = replay();
    game.move("Qe3");
    expect(game.move("Qh7").san).toBe("Qh7#");
    expect(game.isCheckmate()).toBe(true);
    expect(game.attackers(SHOWCASE.finish.mate.covered, "w")).toContain("h7");
    expect(game.attackers("h7", "w")).toContain("f8");
  });

  it("plays the finish from squares the reach table can move", () => {
    const { reply, mate } = SHOWCASE.finish;
    expect(reachOf(reply.from).legal.map((move) => move.to)).toContain(reply.to);
    expect(reachOf(mate.from).legal.map((move) => move.to)).toContain(mate.to);
  });
});

describe("the threat steps", () => {
  it("draw only arrows the piece really makes", () => {
    SHOWCASE.threats.forEach((threat) => {
      threat.arrows.forEach((arrow) => expect(reachOf(arrow.from).attacks).toContain(arrow.to));
    });
  });

  it("ring a black piece on every target and the king on every king ring", () => {
    SHOWCASE.threats.flatMap((threat) => threat.rings).forEach(({ square, kind }) => {
      const piece = SHOWCASE.position[square];
      expect(piece?.color).toBe("black");
      if (kind === "king") expect(piece?.type).toBe("king");
    });
  });
});

describe("the reach table", () => {
  it("agrees with chess.js for every piece", () => {
    const game = replay();
    expect(Object.keys(SHOWCASE_REACH).sort()).toEqual([...occupied].sort());
    occupied.forEach((square) => {
      const color = SHOWCASE.position[square]!.color === "white" ? "w" : "b";
      const reach = reachOf(square);
      reach.attacks.forEach((target) => expect(game.attackers(target, color)).toContain(square));
      if (color === game.turn()) {
        const legal = game.moves({ square, verbose: true }).map((move) => ({ to: move.to, san: move.san }));
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
