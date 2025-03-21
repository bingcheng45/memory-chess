'use client';

import { useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { ChessPiece, PieceType, PieceColor } from '@/components/features/game/ChessBoard/ChessBoard.types';

const PIECE_TYPES: PieceType[] = ['pawn', 'rook', 'knight', 'bishop', 'queen', 'king'];
const PIECE_SYMBOLS: Record<PieceType, string> = {
  pawn: '♟',
  rook: '♜',
  knight: '♞',
  bishop: '♝',
  queen: '♛',
  king: '♚'
};

function generatePieces(count: number = 8): ChessPiece[] {
  const pieces: ChessPiece[] = [];
  const positions = generateRandomPositions(count * 2);
  let id = 1;

  // Create pairs of pieces
  for (let i = 0; i < count; i++) {
    const type = PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
    const color: PieceColor = Math.random() < 0.5 ? 'white' : 'black';
    const symbol = PIECE_SYMBOLS[type];

    // Create two pieces of the same type for matching
    for (let j = 0; j < 2; j++) {
      pieces.push({
        id: `piece-${id++}`,
        type,
        color,
        position: positions[pieces.length],
        symbol,
        isRevealed: false,
        isMatched: false
      });
    }
  }

  return pieces;
}

function generateRandomPositions(count: number) {
  const positions = [];
  const usedPositions = new Set<string>();

  while (positions.length < count) {
    const row = Math.floor(Math.random() * 8);
    const col = Math.floor(Math.random() * 8);
    const posKey = `${row}-${col}`;

    if (!usedPositions.has(posKey)) {
      positions.push({ row, col });
      usedPositions.add(posKey);
    }
  }

  return positions;
}

export function GameClient() {
  const { initializeGame } = useGameStore();

  useEffect(() => {
    // Initialize the game with random pieces
    const pieces = generatePieces(8);
    initializeGame(pieces);
  }, [initializeGame]);

  return null;
} 