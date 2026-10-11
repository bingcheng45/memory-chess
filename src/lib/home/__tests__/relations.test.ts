/** @jest-environment node */

import { Chess, type Color, type Square } from "chess.js";
import en from "../../../../messages/en.json";
import { BOARD_SQUARES, type SquareName } from "@/lib/game/board";
import { isDarkSquare, labPositionToFen } from "@/lib/home/calibration";
import type { Relation } from "@/lib/home/relations";
import { pieceTypeToFenChar } from "@/utils/chessPieces";
import { SHOWCASE } from "@/lib/home/showcase";
import { LINARES_MOVES, STUDY_PLY } from "@/lib/home/showcaseGame";
import { SHOWCASE_FRAMES } from "@/lib/home/showcaseReplay";
import { boardAfter } from "@/lib/home/showcaseTour";
import {
  SIDE_COUNTS,
  SPECIMEN,
  SPECIMEN_ANCHORS,
  SPECIMEN_CHECKS,
  SPECIMEN_FEN,
  SPECIMEN_GROUPS,
  SPECIMEN_RECALL,
} from "@/lib/home/specimen";

/** Kasparov against Topalov, Wijk aan Zee 1999, through 44.Qa7. */
const IMMORTAL_MOVES =
  "e4 d6 d4 Nf6 Nc3 g6 Be3 Bg7 Qd2 c6 f3 b5 Nge2 Nbd7 Bh6 Bxh6 Qxh6 Bb7 a3 e5 O-O-O Qe7 Kb1 a6 Nc1 O-O-O Nb3 exd4 Rxd4 c5 Rd1 Nb6 g3 Kb8 Na5 Ba8 Bh3 d5 Qf4+ Ka7 Rhe1 d4 Nd5 Nbxd5 exd5 Qd6 Rxd4 cxd4 Re7+ Kb6 Qxd4+ Kxa5 b4+ Ka4 Qc3 Qxd5 Ra7 Bb7 Rxb7 Qc4 Qxf6 Kxa3 Qxa6+ Kxb4 c3+ Kxc3 Qa1+ Kd2 Qb2+ Kd1 Bf1 Rd2 Rd7 Rxd7 Bxc4 bxc4 Qxh8 Rd3 Qa8 c3 Qa4+ Ke1 f4 f5 Kc1 Rd2 Qa7".split(
    " ",
  );

const replay = (moves: readonly string[], plies = moves.length) => {
  const game = new Chess();
  moves.slice(0, plies).forEach((move) => game.move(move));
  return game;
};

const other = (color: Color): Color => (color === "w" ? "b" : "w");
const rankOf = (square: SquareName) => Number(square[1]);

/** Does `from` see `to`, whatever stands there? An enemy knight stands in for the defended piece. */
function sees(game: Chess, from: SquareName, to: SquareName): boolean {
  const piece = game.get(from as Square);
  if (!piece) return false;
  const probe = new Chess(game.fen());
  probe.remove(to as Square);
  probe.put({ type: "n", color: other(piece.color) }, to as Square);
  return probe.attackers(to as Square, piece.color).includes(from as Square);
}

/** The same predicate for every arrow the homepage draws. */
function holds(fen: string, { kind, from, to }: Relation): boolean {
  const game = new Chess(fen);
  const piece = game.get(from as Square);
  const target = game.get(to as Square);
  if (!piece) return false;
  switch (kind) {
    case "attacks":
      return !!target && target.color !== piece.color && target.type !== "k" && sees(game, from, to);
    case "defends":
      return !!target && target.color === piece.color && sees(game, from, to);
    case "controls":
      return !target && sees(game, from, to);
    case "chain":
      return piece.type === "p" && target?.type === "p" && target.color === piece.color && sees(game, from, to);
    case "blocked": {
      if (piece.type !== "p" || target?.type !== "p" || target.color === piece.color || from[0] !== to[0]) return false;
      const ahead = piece.color === "w" ? 1 : -1;
      return rankOf(to) - rankOf(from) === ahead;
    }
  }
}

const describeRelation = ({ kind, from, to }: Relation) => `${from} ${kind} ${to}`;
const expectAllHold = (fen: string, relations: readonly Relation[]) => {
  expect(relations.filter((item) => !holds(fen, item)).map(describeRelation)).toEqual([]);
  expect(relations.length).toBeGreaterThan(0);
};
const countPieces = (fen: string, color?: Color) =>
  new Chess(fen)
    .board()
    .flat()
    .filter((cell) => cell && (!color || cell.color === color)).length;

/** Moves in game notation, from the ply after the study position: "47...Bh3", "48.gxh3 Kf5". */
function notation(from: number, to: number): string {
  return SHOWCASE_FRAMES.slice(from, to + 1)
    .map((frame, offset) => {
      const ply = STUDY_PLY + from + offset + 1;
      const number = Math.ceil(ply / 2);
      if (ply % 2 === 1) return `${number}.${frame.san}`;
      return offset === 0 ? `${number}...${frame.san}` : frame.san;
    })
    .join(" ");
}

const hero = en.home.lab.hero.showcase.steps;
const method = en.home.lab.method.phases;

describe("the hero: Topalov against Shirov, Linares 1998", () => {
  it("studies the board after 47.Kg1, as the game record reaches it", () => {
    const game = replay(LINARES_MOVES, STUDY_PLY);
    expect(game.fen()).toBe(SHOWCASE.fen);
    expect(labPositionToFen(SHOWCASE.position)).toBe(SHOWCASE.fen.split(" ")[0]);
    expect(LINARES_MOVES).toHaveLength(106);
  });

  it("follows every piece through every ply exactly as chess.js plays it", () => {
    SHOWCASE_FRAMES.forEach((frame, index) => {
      const game = replay(LINARES_MOVES, STUDY_PLY + index + 1);
      expect(frame.fen).toBe(game.fen());
      const { placements, gone } = boardAfter(index + 1);
      const fromTour = Object.entries(placements)
        .filter(([home]) => !gone.includes(home as SquareName))
        .map(([home, square]) => {
          const piece = SHOWCASE.position[home as SquareName]!;
          return `${square} ${pieceTypeToFenChar(piece.type, piece.color)}`;
        });
      const fromEngine = game
        .board()
        .flat()
        .flatMap((cell) => (cell ? [`${cell.square} ${cell.color === "w" ? cell.type.toUpperCase() : cell.type}`] : []));
      expect(fromTour.sort()).toEqual(fromEngine.sort());
    });
    expect([...boardAfter(SHOWCASE_FRAMES.length).gone].sort()).toEqual(["f5", "f6"]);
  });

  it("draws only relations that hold on the study board", () => {
    expectAllHold(SHOWCASE.fen, SHOWCASE.groups.flatMap((group) => group.relations));
    expectAllHold(SHOWCASE.fen, SHOWCASE.trap.relations);
    expectAllHold(SHOWCASE.fen, SHOWCASE.check.relations);
  });

  it("draws only relations that hold on the board each stretch of the game ends on", () => {
    SHOWCASE.scenes
      .filter((scene) => scene.annotations.relations.length > 0)
      .forEach((scene) => expectAllHold(SHOWCASE_FRAMES[scene.plies.to].fen, scene.annotations.relations));
  });

  it("draws each path along squares the piece really took", () => {
    SHOWCASE.scenes.forEach((scene) => {
      const played = SHOWCASE_FRAMES.slice(scene.plies.from, scene.plies.to + 1);
      scene.annotations.moves.forEach((move) =>
        expect(played.some((frame) => frame.from === move.from && frame.to === move.to)).toBe(true),
      );
    });
  });

  it("puts every piece in exactly one group", () => {
    const grouped = SHOWCASE.groups.flatMap((group) => group.squares);
    expect([...grouped].sort()).toEqual(Object.keys(SHOWCASE.position).sort());
    SHOWCASE.groups
      .filter((group) => group.side !== "mixed")
      .forEach((group) =>
        group.squares.forEach((square) => expect(SHOWCASE.position[square]?.color).toBe(group.side)),
      );
  });

  it("leaves the black king only Kd6, Kd7, Ke7 and Kf7, as the trap says", () => {
    const moves = new Chess(SHOWCASE.fen).moves({ square: "e6" });
    expect([...moves].sort()).toEqual(["Kd6", "Kd7", "Ke7", "Kf7"]);
    expect(hero.trap.king.thought).toContain("Kd6, Kd7, Ke7 and Kf7");
    const reachable = new Chess(SHOWCASE.fen).moves({ square: "e6", verbose: true }).map((move) => move.to);
    SHOWCASE.trap.crosses.forEach((square) => expect(reachable).not.toContain(square));
  });

  it("names the moves each caption plays, in game notation", () => {
    const [sacrifice, walk, runners] = SHOWCASE.scenes;
    expect(hero.game.sacrifice.caption).toContain(notation(sacrifice.plies.from, sacrifice.plies.to));
    expect(hero.game.walk.caption).toContain(notation(walk.plies.from, walk.plies.to));
    expect(hero.game.runners.caption).toContain(notation(runners.plies.from, runners.plies.to));
    expect(notation(0, 0)).toBe("47...Bh3");
    expect(runners.plies.to).toBe(SHOWCASE_FRAMES.length - 1);
    expect(hero.game.runners.thought).toContain("resigned after 53...Kb3");
  });

  it("counts ten pieces, four white and six black, as the captions say", () => {
    expect(countPieces(SHOWCASE.fen)).toBe(10);
    expect(countPieces(SHOWCASE.fen, "w")).toBe(4);
    expect(countPieces(SHOWCASE.fen, "b")).toBe(6);
    expect(hero.study.intro.caption).toContain("Ten pieces");
    expect(hero.rebuild.check.caption).toMatch(/four white, six black/i);
  });

  it("checks bishops on opposite colours: c3 dark, f5 light", () => {
    const dark = (square: SquareName) => isDarkSquare(BOARD_SQUARES.indexOf(square));
    expect(dark("c3")).toBe(true);
    expect(dark("f5")).toBe(false);
    expect(SHOWCASE.position.c3).toEqual({ color: "white", type: "bishop" });
    expect(SHOWCASE.position.f5).toEqual({ color: "black", type: "bishop" });
    expect(hero.rebuild.check.caption).toContain("c3 dark and f5 light");
  });
});

describe("the microscope: Kasparov against Topalov, Wijk aan Zee 1999", () => {
  const recallFen = `${labPositionToFen(SPECIMEN_RECALL)} b - - 3 44`;

  it("studies the final position, as the game record reaches it", () => {
    expect(replay(IMMORTAL_MOVES).fen()).toBe(SPECIMEN_FEN);
    expect(labPositionToFen(SPECIMEN)).toBe(SPECIMEN_FEN.split(" ")[0]);
  });

  it("draws only relations that hold on the specimen", () => {
    expectAllHold(SPECIMEN_FEN, SPECIMEN_GROUPS.flatMap((group) => group.relations));
  });

  it("grades each relation on the rebuild the way chess.js does", () => {
    const verdicts = SPECIMEN_CHECKS.map((check) => [describeRelation(check.relation), check.holds]);
    const truth = SPECIMEN_CHECKS.map((check) => [describeRelation(check.relation), holds(recallFen, check.relation)]);
    expect(verdicts).toEqual(truth);
    expect(SPECIMEN_CHECKS.filter((check) => !check.holds).map((check) => describeRelation(check.relation))).toEqual([
      "c2 defends d2",
    ]);
  });

  it("has a pawn on c2 guard d1, not d2", () => {
    const game = new Chess(recallFen);
    expect(game.get("c2")).toEqual({ type: "p", color: "b" });
    expect(sees(game, "c2", "d2")).toBe(false);
    expect(sees(game, "c2", "d1")).toBe(true);
    expect(method.score.body).toContain("From c2 the pawn guards d1, not d2");
  });

  it("anchors on both kings and groups every piece", () => {
    expect(SPECIMEN_ANCHORS.map((square) => SPECIMEN[square])).toEqual([
      { color: "white", type: "king" },
      { color: "black", type: "king" },
    ]);
    const grouped = new Set(SPECIMEN_GROUPS.flatMap((group) => group.squares));
    expect([...grouped].sort()).toEqual(Object.keys(SPECIMEN).sort());
  });

  it("counts eleven pieces, five white and six black, as the captions say", () => {
    expect(countPieces(SPECIMEN_FEN)).toBe(11);
    expect(countPieces(recallFen, "w")).toBe(5);
    expect(countPieces(recallFen, "b")).toBe(6);
    expect(SIDE_COUNTS).toEqual({ white: 5, black: 6 });
    expect(method.study.title).toContain("Eleven pieces");
    expect(method.chunk.title).toContain("Eleven pieces");
    expect(method.score.body).toContain("five and six");
  });
});
