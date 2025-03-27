'use client';

import React from 'react';
import { FILES, RANKS } from '@/types/chess';

interface BoardCoordinatesProps {
  readonly showCoordinates: boolean;
  readonly file: number;
  readonly rank: number;
  readonly position: 'file' | 'rank';
}

export function BoardCoordinates({ 
  showCoordinates, 
  file, 
  rank, 
  position 
}: BoardCoordinatesProps) {
  if (!showCoordinates) return null;
  
  if (position === 'file' && rank === 0) {
    return (
      <div className="absolute bottom-0 right-1 text-xs font-medium text-black dark:text-black">
        {FILES[file]}
      </div>
    );
  }
  
  if (position === 'rank' && file === 0) {
    return (
      <div className="absolute top-0 left-1 text-xs font-medium text-black dark:text-black">
        {RANKS[rank]}
      </div>
    );
  }
  
  return null;
} 