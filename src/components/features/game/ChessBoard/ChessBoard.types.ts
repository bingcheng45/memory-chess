export interface Position {
  row: number;
  col: number;
}

export type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
export type PieceColor = 'white' | 'black';

export interface ChessPiece {
  id: string;
  type: PieceType;
  color: PieceColor;
  position: Position;
  symbol: string;
  isRevealed?: boolean;
  isMatched?: boolean;
}

export interface Move {
  piece: ChessPiece;
  from: Position;
  to: Position;
}

export interface GameState {
  pieces: ChessPiece[];
  selectedPiece: ChessPiece | null;
  moves: Move[];
  matchedPairs: string[];
  gameStatus: 'idle' | 'playing' | 'paused' | 'completed';
  score: number;
  timeElapsed: number;
} 