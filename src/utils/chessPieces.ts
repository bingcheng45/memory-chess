import { ChessPiece, PieceType, PieceColor } from "@/types/chess";

/** Cburnett's piece artwork, copied into public/pieces with its BSD licence (see LICENSE.txt there). */
const PIECES_PATH = "/pieces";

/**
 * Gets the image URL for a chess piece.
 *
 * @param type The type of the piece
 * @param color The color of the piece
 * @returns The URL of the image for the piece
 */
export function getPieceImageUrl(type: PieceType, color: PieceColor): string {
  return `${PIECES_PATH}/${color}-${type}.svg`;
}

/**
 * Gets the alt text for a chess piece.
 *
 * @param type The type of the piece
 * @param color The color of the piece
 * @returns The alt text for the piece
 */
export function getPieceAltText(type: PieceType, color: PieceColor): string {
  return `${color} ${type}`;
}

/**
 * Gets the Unicode symbol for a chess piece (fallback for image loading failures).
 *
 * @param type The type of the piece
 * @param color The color of the piece
 * @returns The Unicode symbol for the piece
 */
export function getPieceSymbol(type: PieceType, color: PieceColor): string {
  const symbols = {
    white: {
      king: "♔",
      queen: "♕",
      rook: "♖",
      bishop: "♗",
      knight: "♘",
      pawn: "♙",
    },
    black: {
      king: "♚",
      queen: "♛",
      rook: "♜",
      bishop: "♝",
      knight: "♞",
      pawn: "♟",
    },
  };

  return symbols[color][type];
}

/**
 * Maps a chess.js piece notation to a PieceType.
 *
 * @param piece The chess.js piece notation (e.g., 'p', 'n', 'b', 'r', 'q', 'k')
 * @returns The corresponding PieceType
 */
export function mapChessJsPieceToType(piece: string): PieceType {
  const mapping: Record<string, PieceType> = {
    p: "pawn",
    n: "knight",
    b: "bishop",
    r: "rook",
    q: "queen",
    k: "king",
  };

  return mapping[piece.toLowerCase()] || "pawn";
}

const PIECE_TYPE_TO_FEN_CHAR: Readonly<Record<PieceType, string>> = {
  pawn: "p",
  knight: "n",
  bishop: "b",
  rook: "r",
  queen: "q",
  king: "k",
};

/**
 * Maps a PieceType and color to its FEN character, the inverse of
 * mapChessJsPieceToType. White pieces are uppercase, black lowercase.
 *
 * Knight maps to "n" because chess notation reserves "k" for the king.
 * Deriving the character from the first letter of the type name instead
 * silently turns every knight into a king.
 *
 * @param type The type of the piece
 * @param color The color of the piece
 * @returns The FEN character for the piece
 */
export function pieceTypeToFenChar(type: PieceType, color: PieceColor): string {
  const char = PIECE_TYPE_TO_FEN_CHAR[type];

  return color === "white" ? char.toUpperCase() : char;
}

/**
 * Converts the piece-placement section of a FEN string into UI chess pieces.
 * Throws when the board portion is malformed so callers can show a fallback.
 */
export function fenToChessPieces(fen: string): ChessPiece[] {
  const boardPosition = fen.trim().split(/\s+/)[0];
  const rows = boardPosition?.split("/") ?? [];

  if (rows.length !== 8) {
    throw new Error("Invalid FEN: expected eight ranks");
  }

  const pieces: ChessPiece[] = [];

  rows.forEach((row, rankIndex) => {
    let fileIndex = 0;

    for (const character of row) {
      if (/^[1-8]$/.test(character)) {
        fileIndex += Number(character);
        continue;
      }

      if (!/^[prnbqkPRNBQK]$/.test(character) || fileIndex >= 8) {
        throw new Error("Invalid FEN: unsupported board contents");
      }

      pieces.push({
        id: `${fileIndex}-${rankIndex}-${character}`,
        type: mapChessJsPieceToType(character),
        color: character === character.toUpperCase() ? "white" : "black",
        position: {
          file: fileIndex,
          rank: 7 - rankIndex,
        },
      });
      fileIndex += 1;
    }

    if (fileIndex !== 8) {
      throw new Error("Invalid FEN: each rank must contain eight squares");
    }
  });

  return pieces;
}
