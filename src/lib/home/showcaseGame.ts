/**
 * Veselin Topalov (White) against Alexey Shirov, Linares 1998, round 10, 0-1:
 * the whole game. Source: https://www.chessgames.com/perl/chessgame?gid=1143956
 * Only the generator and the tests read it, so the client bundle never carries it.
 * scripts/generate-showcase-reach.mjs imports this file directly, so it must stay
 * free of path aliases and imports.
 */
export const LINARES_MOVES: readonly string[] =
  "d4 Nf6 c4 g6 Nc3 d5 cxd5 Nxd5 e4 Nxc3 bxc3 Bg7 Bb5+ c6 Ba4 O-O Ne2 Nd7 O-O e5 f3 Qe7 Be3 Rd8 Qc2 Nb6 Bb3 Be6 Rad1 Nc4 Bc1 b5 f4 exd4 Nxd4 Bg4 Rde1 Qc5 Kh1 a5 h3 Bd7 a4 bxa4 Ba2 Be8 e5 Nb6 f5 Nd5 Bd2 Nb4 Qxa4 Nxa2 Qxa2 Bxe5 fxg6 hxg6 Bg5 Rd5 Re3 Qd6 Qe2 Bd7 c4 Bxd4 cxd5 Bxe3 Qxe3 Re8 Qc3 Qxd5 Bh6 Re5 Rf3 Qc5 Qa1 Bf5 Re3 f6 Rxe5 Qxe5 Qa2+ Qd5 Qxd5+ cxd5 Bd2 a4 Bc3 Kf7 h4 Ke6 Kg1 Bh3 gxh3 Kf5 Kf2 Ke4 Bxf6 d4 Be7 Kd3 Bc5 Kc4 Be7 Kb3".split(
    " ",
  );

/** The study position is the board after 47.Kg1, the moment before 47...Bh3. */
export const STUDY_PLY = 93;
