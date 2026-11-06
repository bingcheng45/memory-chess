/**
 * The phone first screen's copy and boards. English only for now (FIRST_SCREEN_LOCALES); the copy moves into the
 * message catalogues when it is translated.
 */
export const FIRST_SCREEN_COPY = {
  label: "Najdorf's 45 boards",
  kicker: "São Paulo · January 1947",
  boardsAlt: "Fifteen chessboards from a blindfold simultaneous exhibition",
  boardsCaption: "45 boards, like these",
  headlineBefore: "Najdorf held ",
  headlineEm: "45 boards",
  headlineAfter: " in his head. How many can you hold?",
  lede: "Memory Chess shows you a position for a few seconds, then hides it. Rebuild it and get a score.",
  play: "Play a free round",
  story: "Read Najdorf's story",
  fine: "Free · no account · about a minute",
} as const;

export const NAJDORF_ARTICLE_HREF = "/articles/miguel-najdorf";

/**
 * Fifteen of the intro's games (src/lib/home/intro/simulGames.ts) as FEN piece placement, with one square lit as the
 * last move, the way the intro lights a move. Copied here so the home page does not load the intro's games.
 */
export const FIRST_SCREEN_BOARDS: readonly { readonly fen: string; readonly lit: string }[] = [
  { fen: "r1b1k2r/2pqbppp/p1p5/8/4n3/8/PPPP1PPP/RNBQ1RK1", lit: "e4" },
  { fen: "r1b5/ppp2kpr/3p4/8/4n3/N1P1P3/Pn6/R3K3", lit: "b2" },
  { fen: "4kb1r/1p4pp/2np4/4p3/1P6/2N1P3/2P3PP/R3K1R1", lit: "g1" },
  { fen: "rn6/ppp1kp1p/6p1/4P3/8/7P/PPP1RK1P/R7", lit: "e2" },
  { fen: "rn2kbnr/p3pppp/2p5/8/3q3P/6N1/PP3PP1/R1B1KBNR", lit: "d4" },
  { fen: "rnb3k1/pp3pp1/2p4p/3p4/3P4/1P3P2/P3N1PP/R3KB1R", lit: "e2" },
  { fen: "rn1qkb1r/pp2pppp/2p5/3n1b2/P1pP4/5N2/1P2PPPP/R1BQKB1R", lit: "a4" },
  { fen: "rn3k2/pp3p1p/6p1/2p2p2/2P5/5N1R/PP3PP1/R2NKB2", lit: "h3" },
  { fen: "rnb2rk1/ppp2ppn/4p3/3q4/3P4/1QP1P3/P4PPP/R1B1K1NR", lit: "b3" },
  { fen: "rn1qkb1r/pbp2ppp/8/4p3/N7/6P1/PP1PPP1P/R1B1K1NR", lit: "a4" },
  { fen: "r1bqkb1r/pp3ppp/2n1pn2/2pp4/3P1B2/2P1PN2/PP3PPP/RN1QKB1R", lit: "f4" },
  { fen: "r3k2r/p1p1pp2/2p2p2/8/8/2N5/PP3PPP/R1b1K2R", lit: "c1" },
  { fen: "1r2k2r/p1p3pp/8/2p5/8/P1N1P1P1/1P5P/1b2K2R", lit: "b1" },
  { fen: "rn3k2/ppp1pp1p/8/6p1/4P3/2P5/P4PBP/R1B1K1NR", lit: "g2" },
  { fen: "r1bqk2r/1pppbppp/p1B2n2/4p3/4P3/5N2/PPPP1PPP/RNBQ1RK1", lit: "c6" },
];

const GLYPH: Record<string, string> = { K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙", k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" };
/** Text presentation selector, so iOS draws the black pawn as a glyph and not as an emoji. */
const TEXT = String.fromCharCode(0xfe0e);

export interface PlacedPiece {
  readonly file: number;
  readonly rank: number;
  readonly glyph: string;
  readonly white: boolean;
}

/** The pieces of a FEN placement, with file 0 to 7 from a and rank 0 to 7 from the eighth rank. */
export function piecesOf(fen: string): PlacedPiece[] {
  return fen.split("/").flatMap((row, rank) => {
    let file = 0;
    return [...row].flatMap((letter) => {
      if (/\d/.test(letter)) {
        file += Number(letter);
        return [];
      }
      const piece = { file, rank, glyph: (GLYPH[letter] ?? "") + TEXT, white: letter === letter.toUpperCase() };
      file += 1;
      return [piece];
    });
  });
}

/** A square name as file and rank in the same frame as piecesOf. */
export function squareAt(square: string): { readonly file: number; readonly rank: number } {
  return { file: square.charCodeAt(0) - 97, rank: 8 - Number(square[1]) };
}
