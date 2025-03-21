'use client';

import React from 'react';
import { ChessPiece } from '@/types/chess';
import { getPieceSymbol } from '@/utils/chess';

interface ChessPieceProps {
  readonly piece: ChessPiece;
}

export default function ChessPieceComponent({ piece }: ChessPieceProps) {
  // Use standardized styling for chess pieces
  const textColorClass = piece.color === 'white' 
    ? 'text-white drop-shadow-md' 
    : 'text-black drop-shadow-sm';
  
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-4/5 h-4/5 flex items-center justify-center">
        <span 
          className={`text-3xl sm:text-4xl md:text-5xl font-bold ${textColorClass}`}
          style={{ lineHeight: 1 }}
          data-testid={`piece-${piece.type}-${piece.color}`}
        >
          {getPieceSymbol(piece.type, piece.color)}
        </span>
      </div>
    </div>
  );
} 