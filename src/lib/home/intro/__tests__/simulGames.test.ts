import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { Chess } from "chess.js";
import type { SimulBoard, SimulPiece } from "@/lib/home/intro/simul";
import { SIMUL_BOARDS, SIMUL_HERO } from "@/lib/home/intro/simulGames";
import { BOT_BOARDS, BOT_PLIES, OPENINGS, OPERA_MOVES } from "@/lib/home/intro/simulSource";

type Squares = Map<string, SimulPiece>;

function placementOf(game: Chess): Squares {
  const squares: Squares = new Map();
  game
    .board()
    .flat()
    .forEach((piece) => {
      if (piece) squares.set(piece.square, (piece.color === "w" ? piece.type.toUpperCase() : piece.type) as SimulPiece);
    });
  return squares;
}

/** What the player does: start from the FEN's pieces and apply each ply's changes, without chess rules. */
function replay(board: SimulBoard): Squares[] {
  let squares = placementOf(new Chess(board.fen));
  return board.plies.map(({ changes }) => {
    const next = new Map(squares);
    changes.forEach(([square, piece]) => (piece ? next.set(square, piece) : next.delete(square)));
    squares = next;
    return squares;
  });
}

const sorted = (squares: Squares) => [...squares].sort(([a], [b]) => a.localeCompare(b));

describe("every board", () => {
  it.each([SIMUL_HERO, ...SIMUL_BOARDS].map((board, index) => [index, board.name, board] as const))(
    "board %i (%s) plays legal moves and its changes rebuild chess.js's board at every ply",
    (_index, _name, board) => {
      const game = new Chess(board.fen);
      const replayed = replay(board);
      board.plies.forEach(({ san }, ply) => {
        expect(() => game.move(san)).not.toThrow();
        expect(sorted(replayed[ply]!)).toEqual(sorted(placementOf(game)));
      });
    },
  );
});

describe("the centre board", () => {
  it("is the Opera Game from the start, ending in mate on move 17", () => {
    expect(SIMUL_HERO.fen).toBe("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
    expect(SIMUL_HERO.plies.map((ply) => ply.san)).toEqual(OPERA_MOVES);
    const game = new Chess();
    OPERA_MOVES.forEach((san) => game.move(san));
    expect(game.fen()).toBe("1n1Rkb1r/p4ppp/4q3/4p1B1/4P3/8/PPP2PPP/2K5 b k - 1 17");
    expect(game.isCheckmate()).toBe(true);
  });

  it("resolves castling into both the king and the rook", () => {
    expect(SIMUL_HERO.plies[22]).toEqual({
      san: "O-O-O",
      changes: [
        ["a1", null],
        ["c1", "K"],
        ["d1", "R"],
        ["e1", null],
      ],
    });
  });
});

describe("the other boards", () => {
  it("are 44, each playing enough plies for the intro", () => {
    expect(SIMUL_BOARDS).toHaveLength(BOT_BOARDS);
    expect(BOT_BOARDS).toBe(44);
    SIMUL_BOARDS.forEach((board) => expect(board.plies).toHaveLength(BOT_PLIES));
  });

  it("cycle through every opening line", () => {
    expect(new Set(SIMUL_BOARDS.map((board) => board.name))).toEqual(new Set(OPENINGS.map((opening) => opening.name)));
  });

  it("open on different positions", () => {
    expect(new Set(SIMUL_BOARDS.map((board) => board.fen)).size).toBe(SIMUL_BOARDS.length);
  });

  it("are the games the generator writes now", () => {
    const run = spawnSync(
      process.execPath,
      ["--disable-warning=MODULE_TYPELESS_PACKAGE_JSON", join("scripts", "generate-simul-games.mjs"), "--check"],
      { cwd: process.cwd(), encoding: "utf8" },
    );
    expect(run.stderr).toBe("");
    expect(run.status).toBe(0);
  });
});
