import { PieceType, PieceColor } from '@/types/chess';

// Base URL for Wikimedia Commons chess piece images
const WIKIMEDIA_BASE_URL = 'https://upload.wikimedia.org/wikipedia/commons/';

// Map of piece types and colors to their image URLs
const pieceImages: Record<PieceColor, Record<PieceType, string>> = {
  white: {
    king: `${WIKIMEDIA_BASE_URL}4/42/Chess_klt45.svg`,
    queen: `${WIKIMEDIA_BASE_URL}1/15/Chess_qlt45.svg`,
    rook: `${WIKIMEDIA_BASE_URL}7/72/Chess_rlt45.svg`,
    bishop: `${WIKIMEDIA_BASE_URL}b/b1/Chess_blt45.svg`,
    knight: `${WIKIMEDIA_BASE_URL}7/70/Chess_nlt45.svg`,
    pawn: `${WIKIMEDIA_BASE_URL}4/45/Chess_plt45.svg`
  },
  black: {
    king: `${WIKIMEDIA_BASE_URL}f/f0/Chess_kdt45.svg`,
    queen: `${WIKIMEDIA_BASE_URL}4/47/Chess_qdt45.svg`,
    rook: `${WIKIMEDIA_BASE_URL}f/ff/Chess_rdt45.svg`,
    bishop: `${WIKIMEDIA_BASE_URL}9/98/Chess_bdt45.svg`,
    knight: `${WIKIMEDIA_BASE_URL}e/ef/Chess_ndt45.svg`,
    pawn: `${WIKIMEDIA_BASE_URL}c/c7/Chess_pdt45.svg`
  }
};

/**
 * Gets the image URL for a chess piece.
 * 
 * @param type The type of the piece
 * @param color The color of the piece
 * @returns The URL of the image for the piece
 */
export function getPieceImageUrl(type: PieceType, color: PieceColor): string {
  return pieceImages[color][type];
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
      king: '♔',
      queen: '♕',
      rook: '♖',
      bishop: '♗',
      knight: '♘',
      pawn: '♙'
    },
    black: {
      king: '♚',
      queen: '♛',
      rook: '♜',
      bishop: '♝',
      knight: '♞',
      pawn: '♟'
    }
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
    'p': 'pawn',
    'n': 'knight',
    'b': 'bishop',
    'r': 'rook',
    'q': 'queen',
    'k': 'king'
  };
  
  return mapping[piece.toLowerCase()] || 'pawn';
} 