'use client';

import { useState } from 'react';
import { useGameStore } from '@/lib/store/gameStore';

interface GameConfigProps {
  readonly onStart?: (pieceCount: number, memorizeTime: number) => void;
}

export default function GameConfig({ onStart }: GameConfigProps) {
  const { startGame } = useGameStore();
  const [pieceCount, setPieceCount] = useState(8);
  const [memorizeTime, setMemorizeTime] = useState(10);
  
  const handleStart = () => {
    if (onStart) {
      onStart(pieceCount, memorizeTime);
    } else {
      startGame(pieceCount, memorizeTime);
    }
  };
  
  return (
    <div className="w-full max-w-md rounded-xl border border-gray-light bg-gray-dark p-8 shadow-xl">
      <h2 className="mb-8 text-center text-2xl font-bold text-peach-100">Game Configuration</h2>
      
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between">
          <label htmlFor="pieceCount" className="text-sm font-medium text-peach-200">
            Number of Pieces
          </label>
          <span className="rounded-full bg-peach-500 px-3 py-1 text-sm font-medium text-black">
            {pieceCount}
          </span>
        </div>
        <input
          id="pieceCount"
          type="range"
          min="4"
          max="32"
          value={pieceCount}
          onChange={(e) => setPieceCount(parseInt(e.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-light"
          style={{
            backgroundImage: `linear-gradient(to right, #FFB894 0%, #FFB894 ${(pieceCount - 4) * 100 / 28}%, #3A3A3A ${(pieceCount - 4) * 100 / 28}%, #3A3A3A 100%)`
          }}
        />
        <div className="mt-1 flex justify-between text-xs text-gray-400">
          <span>4</span>
          <span>16</span>
          <span>32</span>
        </div>
      </div>
      
      <div className="mb-10">
        <div className="mb-2 flex items-center justify-between">
          <label htmlFor="memorizeTime" className="text-sm font-medium text-peach-200">
            Memorization Time
          </label>
          <span className="rounded-full bg-peach-500 px-3 py-1 text-sm font-medium text-black">
            {memorizeTime}s
          </span>
        </div>
        <input
          id="memorizeTime"
          type="range"
          min="5"
          max="30"
          value={memorizeTime}
          onChange={(e) => setMemorizeTime(parseInt(e.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-light"
          style={{
            backgroundImage: `linear-gradient(to right, #FFB894 0%, #FFB894 ${(memorizeTime - 5) * 100 / 25}%, #3A3A3A ${(memorizeTime - 5) * 100 / 25}%, #3A3A3A 100%)`
          }}
        />
        <div className="mt-1 flex justify-between text-xs text-gray-400">
          <span>5s</span>
          <span>15s</span>
          <span>30s</span>
        </div>
      </div>
      
      <button
        onClick={handleStart}
        className="w-full rounded-lg bg-peach-500 px-4 py-3 font-medium text-black transition-all hover:bg-peach-400 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-peach-300"
      >
        Start Game
      </button>
    </div>
  );
} 