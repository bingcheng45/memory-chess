'use client';

import { useState, useEffect } from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import { Button } from "@/components/ui/button";

interface GameConfigProps {
  readonly onStart?: (pieceCount: number, memorizeTime: number) => void;
}

// Define difficulty presets
interface DifficultyPreset {
  name: string;
  pieceCount: number;
  memorizeTime: number;
  description: string;
}

const DIFFICULTY_PRESETS: DifficultyPreset[] = [
  {
    name: 'Easy',
    pieceCount: 2,
    memorizeTime: 10,
    description: 'Just kings - perfect for starting out'
  },
  {
    name: 'Medium',
    pieceCount: 6,
    memorizeTime: 10,
    description: 'A few pieces with comfortable time to memorize'
  },
  {
    name: 'Hard',
    pieceCount: 12,
    memorizeTime: 8,
    description: 'More pieces with less time to memorize'
  },
  {
    name: 'Grandmaster',
    pieceCount: 20,
    memorizeTime: 5,
    description: 'For chess masters with photographic memory'
  }
];

export default function GameConfig({ onStart }: GameConfigProps) {
  const { 
    startGame, 
    gameState
  } = useGameStore();
  
  const [pieceCount, setPieceCount] = useState(8);
  const [memorizeTime, setMemorizeTime] = useState(10);
  const [selectedPreset, setSelectedPreset] = useState<string>('Easy');
  
  // Initialize with Easy preset values
  useEffect(() => {
    // Set Easy preset as default
    const easyPreset = DIFFICULTY_PRESETS[0];
    setPieceCount(easyPreset.pieceCount);
    setMemorizeTime(easyPreset.memorizeTime);
  }, []);
  
  const handlePresetSelect = (preset: DifficultyPreset) => {
    setPieceCount(preset.pieceCount);
    setMemorizeTime(preset.memorizeTime);
    setSelectedPreset(preset.name);
  };
  
  const handleCustomChange = () => {
    setSelectedPreset('');
  };
  
  const handleStart = () => {
    if (onStart) {
      onStart(pieceCount, memorizeTime);
    } else {
      startGame(pieceCount, memorizeTime);
    }
  };
  
  return (
    <div className="w-full max-w-md md:max-w-lg mx-auto rounded-xl border border-bg-light bg-bg-card p-5 sm:p-7 shadow-xl">
      <h2 className="mb-5 text-center text-2xl font-bold text-text-primary">Game Configuration</h2>
      
      <div className="mb-5">
        <h3 className="mb-3 text-sm font-medium text-text-secondary">Difficulty Presets</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {DIFFICULTY_PRESETS.map((preset) => (
            <Button
              key={preset.name}
              onClick={() => handlePresetSelect(preset)}
              variant={selectedPreset === preset.name ? "secondary" : "ghost"}
              className={`flex h-auto flex-col items-center justify-center p-2.5 ${
                selectedPreset === preset.name 
                  ? 'border-peach-500 bg-peach-500/20 text-text-primary' 
                  : 'border-bg-light text-text-secondary hover:border-peach-500/50 hover:bg-peach-500/10'
              }`}
              aria-pressed={selectedPreset === preset.name}
            >
              <span className="font-medium">{preset.name}</span>
              <div className="mt-1 text-xs opacity-70">
                {preset.pieceCount} pcs / {preset.memorizeTime}s
              </div>
            </Button>
          ))}
        </div>
        <div className="mt-2 text-xs text-text-muted">
          {selectedPreset && selectedPreset !== '' && DIFFICULTY_PRESETS.find(p => p.name === selectedPreset)?.description}
          {(!selectedPreset || selectedPreset === '') && "Custom settings"}
        </div>
      </div>
      
      <div className="mb-5">
        <div className="mb-3 flex items-center justify-between">
          <label htmlFor="pieceCount" className="text-sm font-medium text-text-secondary">
            Number of Pieces
          </label>
          <span className="rounded-full bg-peach-500 px-3 py-1 text-sm font-bold text-bg-dark">
            {pieceCount}
          </span>
        </div>
        <input
          id="pieceCount"
          type="range"
          min="2"
          max="32"
          value={pieceCount}
          onChange={(e) => {
            setPieceCount(parseInt(e.target.value));
            handleCustomChange();
          }}
          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-bg-light"
          style={{
            backgroundImage: `linear-gradient(to right, #FFB380 0%, #FFB380 ${(pieceCount - 2) * 100 / 30}%, #222222 ${(pieceCount - 2) * 100 / 30}%, #222222 100%)`
          }}
        />
        <div className="mt-2 flex justify-between text-xs text-text-muted">
          <span>2</span>
          <span>16</span>
          <span>32</span>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <label htmlFor="memorizeTime" className="text-sm font-medium text-text-secondary">
            Memorization Time
          </label>
          <span className="rounded-full bg-peach-500 px-3 py-1 text-sm font-bold text-bg-dark">
            {memorizeTime}s
          </span>
        </div>
        <input
          id="memorizeTime"
          type="range"
          min="5"
          max="30"
          value={memorizeTime}
          onChange={(e) => {
            setMemorizeTime(parseInt(e.target.value));
            handleCustomChange();
          }}
          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-bg-light"
          style={{
            backgroundImage: `linear-gradient(to right, #FFB380 0%, #FFB380 ${(memorizeTime - 5) * 100 / 25}%, #222222 ${(memorizeTime - 5) * 100 / 25}%, #222222 100%)`
          }}
        />
        <div className="mt-2 flex justify-between text-xs text-text-muted">
          <span>5s</span>
          <span>15s</span>
          <span>30s</span>
        </div>
      </div>
      
      <Button
        onClick={handleStart}
        variant="outline"
        size="sm"
        className="w-full bg-peach-500/10 text-peach-500 border-peach-500/30 hover:bg-peach-500/20 px-3 py-1.5 text-sm"
      >
        Start Training
      </Button>
      
      {gameState.completionTime !== undefined && (
        <div className="mt-4 text-center text-sm text-text-secondary">
          <p>
            Last game: 
            {(() => {
              const seconds = Math.floor(gameState.completionTime);
              const milliseconds = Math.round((gameState.completionTime - seconds) * 1000).toString().padStart(3, '0');
              return (
                <>
                  {seconds}<span className="text-xs">{milliseconds}</span>s solution time with {gameState.accuracy}% accuracy
                </>
              );
            })()}
          </p>
        </div>
      )}
    </div>
  );
} 