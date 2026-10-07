/**
 * Deep Fritz (White) against Vladimir Kramnik, game 2 of the Bonn match, 27 November 2006,
 * through 34.Nxf8. Only the reach generator and the showcase test read it, so the client
 * bundle never carries it. scripts/generate-showcase-reach.mjs imports this file directly,
 * so it must stay free of path aliases and imports.
 */
export const BONN_MOVES: readonly string[] =
  "d4 d5 c4 dxc4 e4 b5 a4 c6 Nc3 b4 Na2 Nf6 e5 Nd5 Bxc4 e6 Nf3 a5 Bg5 Qb6 Nc1 Ba6 Qe2 h6 Be3 Bxc4 Qxc4 Nd7 Nb3 Be7 Rc1 O-O O-O Rfc8 Qe2 c5 Nfd2 Qc6 Qh5 Qxa4 Nxc5 Nxc5 dxc5 Nxe3 fxe3 Bxc5 Qxf7+ Kh8 Qf3 Rf8 Qe4 Qd7 Nb3 Bb6 Rfd1 Qf7 Rf1 Qa7 Rxf8+ Rxf8 Nd4 a4 Nxe6 Bxe3+ Kh1 Bxc1 Nxf8".split(
    " ",
  );
