/**
 * What the 45-board intro plays, as SAN: Morphy's Opera Game on the centre board,
 * and 14 opening lines the other 44 boards start from before the bots take over.
 * Only scripts/generate-simul-games.mjs and the tests read it, so the client bundle
 * never carries it. The generator imports this file directly, so it must stay free
 * of path aliases and imports.
 */

/** Paul Morphy (White) against the Duke of Brunswick and Count Isouard, Paris Opera, 1858, 1-0. */
export const OPERA_MOVES: readonly string[] =
  "e4 e5 Nf3 d6 d4 Bg4 dxe5 Bxf3 Qxf3 dxe5 Bc4 Nf6 Qb3 Qe7 Nc3 c6 Bg5 b5 Nxb5 cxb5 Bxb5+ Nbd7 O-O-O Rd8 Rxd7 Rxd7 Rd1 Qe6 Bxd7+ Nxd7 Qb8+ Nxb8 Rd8#".split(
    " ",
  );

export const OPENINGS: readonly { readonly name: string; readonly moves: string }[] = [
  { name: "Ruy Lopez", moves: "e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7" },
  { name: "Italian Game", moves: "e4 e5 Nf3 Nc6 Bc4 Bc5 c3 Nf6 d3 d6" },
  { name: "Sicilian Najdorf", moves: "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6" },
  { name: "French Defence", moves: "e4 e6 d4 d5 Nc3 Nf6 Bg5 Be7 e5 Nfd7" },
  { name: "Caro-Kann Defence", moves: "e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5 Ng3 Bg6" },
  { name: "Queen's Gambit Declined", moves: "d4 d5 c4 e6 Nc3 Nf6 Bg5 Be7 e3 O-O" },
  { name: "Slav Defence", moves: "d4 d5 c4 c6 Nf3 Nf6 Nc3 dxc4 a4 Bf5" },
  { name: "King's Indian Defence", moves: "d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O" },
  { name: "Nimzo-Indian Defence", moves: "d4 Nf6 c4 e6 Nc3 Bb4 e3 O-O Bd3 d5" },
  { name: "English Opening", moves: "c4 e5 Nc3 Nf6 g3 d5 cxd5 Nxd5 Bg2 Nb6" },
  { name: "London System", moves: "d4 d5 Bf4 Nf6 e3 e6 Nf3 c5 c3 Nc6" },
  { name: "Scandinavian Defence", moves: "e4 d5 exd5 Qxd5 Nc3 Qa5 d4 Nf6 Nf3 Bf5" },
  { name: "Scotch Game", moves: "e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Nf6 Nxc6 bxc6" },
  { name: "Grünfeld Defence", moves: "d4 Nf6 c4 g6 Nc3 d5 cxd5 Nxd5 e4 Nxc3" },
];

/** The 44 boards around the centre one. */
export const BOT_BOARDS = 44;

/** Plies each bot board plays during the intro: more than 10 seconds needs, so the player never runs out. */
export const BOT_PLIES = 30;

/** Fixed so every build writes the same games. */
export const SEED = 1947;
