'use client';

import { useState, useEffect } from 'react';
import { useGameStore } from '@/lib/store/gameStore';

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
    gameState, 
    getTotalGames, 
    getSkillRating, 
    getCurrentStreak,
    getRecommendedDifficulty
  } = useGameStore();
  
  const [pieceCount, setPieceCount] = useState(8);
  const [memorizeTime, setMemorizeTime] = useState(10);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  
  // Get player stats
  const skillRating = getSkillRating();
  const currentStreak = getCurrentStreak();
  const totalGames = getTotalGames();
  const recommendedDifficulty = getRecommendedDifficulty();
  
  // Check if this is the first time playing
  useEffect(() => {
    if (totalGames === 0) {
      setShowTutorial(true);
      // Set Easy preset for first-time players
      handlePresetSelect(DIFFICULTY_PRESETS[0]);
    } else {
      // Set recommended difficulty based on skill rating
      const recommendedPreset = getRecommendedPreset();
      if (recommendedPreset) {
        handlePresetSelect(recommendedPreset);
      }
    }
  }, [totalGames]);
  
  // Get recommended preset based on skill rating
  const getRecommendedPreset = (): DifficultyPreset | null => {
    if (skillRating < 1000) {
      return DIFFICULTY_PRESETS[0]; // Easy
    } else if (skillRating < 1500) {
      return DIFFICULTY_PRESETS[1]; // Medium
    } else if (skillRating < 2000) {
      return DIFFICULTY_PRESETS[2]; // Hard
    } else {
      return DIFFICULTY_PRESETS[3]; // Grandmaster
    }
  };
  
  const handlePresetSelect = (preset: DifficultyPreset) => {
    setPieceCount(preset.pieceCount);
    setMemorizeTime(preset.memorizeTime);
    setSelectedPreset(preset.name);
  };
  
  const handleCustomChange = () => {
    setSelectedPreset(null);
  };
  
  const handleStart = () => {
    if (onStart) {
      onStart(pieceCount, memorizeTime);
    } else {
      startGame(pieceCount, memorizeTime);
    }
  };
  
  // Generate a custom difficulty based on recommended difficulty
  const generateCustomDifficulty = () => {
    // Get random values within the recommended range
    const randomPieceCount = Math.floor(
      Math.random() * (recommendedDifficulty.maxPieces - recommendedDifficulty.minPieces + 1) + 
      recommendedDifficulty.minPieces
    );
    
    const randomMemorizeTime = Math.floor(
      Math.random() * (recommendedDifficulty.maxTime - recommendedDifficulty.minTime + 1) + 
      recommendedDifficulty.minTime
    );
    
    setPieceCount(randomPieceCount);
    setMemorizeTime(randomMemorizeTime);
    setSelectedPreset(null);
  };
  
  return (
    <div className="w-full max-w-md rounded-xl border border-bg-light bg-bg-card p-8 shadow-xl">
      <h2 className="mb-6 text-center text-2xl font-bold text-text-primary">Game Configuration</h2>
      
      {showTutorial && (
        <div className="mb-6 rounded-lg bg-peach-500/10 p-4 text-sm text-text-secondary border border-peach-500/20">
          <h3 className="mb-2 font-semibold text-text-primary">How to Play</h3>
          <ol className="list-inside list-decimal space-y-1">
            <li>Choose your difficulty or customize settings</li>
            <li>Memorize the chess position shown</li>
            <li>Recreate the position from memory</li>
            <li>Check your accuracy and time</li>
          </ol>
          <button 
            onClick={() => setShowTutorial(false)}
            className="mt-3 text-peach-500 hover:text-peach-400 font-medium"
          >
            Got it!
          </button>
        </div>
      )}
      
      {/* Player Stats */}
      {totalGames > 0 && (
        <div className="mb-6 rounded-lg bg-bg-dark/30 p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-text-primary">Your Stats</h3>
            <span className="text-xs text-text-secondary">Level: {recommendedDifficulty.name}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Skill Rating:</span>
            <span className="font-medium text-text-primary">{skillRating}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Current Streak:</span>
            <span className="font-medium text-text-primary">{currentStreak}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Games Played:</span>
            <span className="font-medium text-text-primary">{totalGames}</span>
          </div>
          
          <button
            onClick={generateCustomDifficulty}
            className="mt-3 w-full rounded-lg border border-peach-500/30 bg-peach-500/10 px-3 py-2 text-sm font-medium text-peach-500 transition-all hover:bg-peach-500/20"
          >
            Generate Recommended Challenge
          </button>
        </div>
      )}
      
      <div className="mb-6">
        <h3 className="mb-3 text-sm font-medium text-text-secondary">Difficulty Presets</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {DIFFICULTY_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => handlePresetSelect(preset)}
              className={`flex flex-col items-center justify-center rounded-lg border p-3 transition-all
                ${selectedPreset === preset.name 
                  ? 'border-peach-500 bg-peach-500/20 text-text-primary' 
                  : 'border-bg-light bg-bg-dark/30 text-text-secondary hover:border-peach-500/50 hover:bg-peach-500/10'
                }`}
              aria-pressed={selectedPreset === preset.name}
            >
              <span className="font-medium">{preset.name}</span>
              <div className="mt-1 text-xs opacity-70">
                {preset.pieceCount} pcs / {preset.memorizeTime}s
              </div>
            </button>
          ))}
        </div>
        <div className="mt-2 text-xs text-text-muted">
          {selectedPreset && DIFFICULTY_PRESETS.find(p => p.name === selectedPreset)?.description}
          {!selectedPreset && "Custom settings"}
        </div>
      </div>
      
      <div className="mb-6">
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
      
      <div className="mb-8">
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
      
      <button
        onClick={handleStart}
        className="w-full rounded-lg bg-peach-500 px-4 py-3 font-medium text-bg-dark transition-all hover:bg-peach-400 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-peach-300"
      >
        Start Game
      </button>
      
      {gameState.completionTime !== undefined && (
        <div className="mt-4 text-center text-sm text-text-secondary">
          <p>Last game: {gameState.completionTime}s with {gameState.accuracy}% accuracy</p>
        </div>
      )}
    </div>
  );
} 