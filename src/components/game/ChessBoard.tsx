'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/lib/store/gameStore';

export default function ChessBoard() {
  const { chess, gameState } = useGameStore();
  const [position, setPosition] = useState<string[][]>(Array(8).fill(Array(8).fill('')));

  useEffect(() => {
    updateBoard();
  }, [chess]);

  const updateBoard = () => {
    const newPosition = Array(8).fill(0).map(() => Array(8).fill(''));
    const fen = chess.fen();
    const rows = fen.split(' ')[0].split('/');

    rows.forEach((row, i) => {
      let j = 0;
      for (const char of row) {
        if (isNaN(parseInt(char))) {
          newPosition[i][j] = char;
          j++;
        } else {
          j += parseInt(char);
        }
      }
    });

    setPosition(newPosition);
  };

  return (
    <div className="aspect-square w-full max-w-[600px] overflow-hidden rounded-lg border border-white/10 bg-gray-800">
      <div className="grid h-full w-full grid-cols-8 grid-rows-8">
        {position.map((row, i) =>
          row.map((piece, j) => (
            <div
              key={`${i}-${j}`}
              className={`flex items-center justify-center ${
                (i + j) % 2 === 0 ? 'bg-gray-700' : 'bg-gray-600'
              }`}
            >
              {piece && (
                <span className="text-2xl">
                  {getPieceSymbol(piece)}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function getPieceSymbol(piece: string): string {
  const symbols: Record<string, string> = {
    'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
    'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟',
  };
  return symbols[piece] || '';
} 