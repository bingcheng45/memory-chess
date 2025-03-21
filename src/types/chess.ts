export type PieceType = 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king';
export type PieceColor = 'white' | 'black';

export interface Position {
  file: number; // 0-7 (a-h)
  rank: number; // 0-7 (1-8)
}

export interface ChessPiece {
  id: string;
  type: PieceType;
  color: PieceColor;
  position: Position;
}

export interface Square {
  file: number;
  rank: number;
  piece: ChessPiece | null;
}

export type Board = Square[][];

export const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
export const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'];

export function fileToIndex(file: string): number {
  return FILES.indexOf(file.toLowerCase());
}

export function rankToIndex(rank: string): number {
  return RANKS.indexOf(rank);
}

export function indexToFile(index: number): string {
  return FILES[index];
}

export function indexToRank(index: number): string {
  return RANKS[index];
}

export function positionToString(position: Position): string {
  return `${indexToFile(position.file)}${indexToRank(position.rank)}`;
}

export function stringToPosition(str: string): Position {
  if (str.length !== 2) {
    throw new Error(`Invalid position string: ${str}`);
  }
  
  const file = fileToIndex(str[0]);
  const rank = rankToIndex(str[1]);
  
  if (file === -1 || rank === -1) {
    throw new Error(`Invalid position string: ${str}`);
  }
  
  return { file, rank };
} 