'use client';

import { useState } from 'react';
import { useGameStore } from '@/lib/store/gameStore';

interface GameConfigProps {
  readonly onStart?: () => void;
}

export default function GameConfig({ onStart }: GameConfigProps) {
  const { startGame } = useGameStore();
  const [pieceCount, setPieceCount] = useState(8);
  const [memorizeTime, setMemorizeTime] = useState(10);
  
  const handleStart = () => {
    startGame(pieceCount, memorizeTime);
    onStart?.();
  };
  
  return (
    <div className="w-full max-w-md rounded-lg border border-white/10 bg-gray-800 p-6 shadow-lg">
      <h2 className="mb-6 text-center text-2xl font-bold text-white">Game Configuration</h2>
      
      <div className="mb-6">
        <label htmlFor="pieceCount" className="mb-2 block text-sm font-medium text-gray-300">
          Number of Pieces: {pieceCount}
        </label>
        <input
          id="pieceCount"
          type="range"
          min="4"
          max="32"
          value={pieceCount}
          onChange={(e) => setPieceCount(parseInt(e.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-700"
        />
        <div className="mt-1 flex justify-between text-xs text-gray-400">
          <span>4</span>
          <span>16</span>
          <span>32</span>
        </div>
      </div>
      
      <div className="mb-8">
        <label htmlFor="memorizeTime" className="mb-2 block text-sm font-medium text-gray-300">
          Memorization Time: {memorizeTime} seconds
        </label>
        <input
          id="memorizeTime"
          type="range"
          min="5"
          max="30"
          value={memorizeTime}
          onChange={(e) => setMemorizeTime(parseInt(e.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-700"
        />
        <div className="mt-1 flex justify-between text-xs text-gray-400">
          <span>5s</span>
          <span>15s</span>
          <span>30s</span>
        </div>
      </div>
      
      <button
        onClick={handleStart}
        className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
      >
        Start Game
      </button>
    </div>
  );
} 