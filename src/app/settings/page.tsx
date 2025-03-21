'use client';

import React from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import Link from 'next/link';

export default function SettingsPage() {
  const {
    difficulty,
    memorizationTime,
    showCoordinates,
    setDifficulty,
    setMemorizationTime,
    setShowCoordinates
  } = useSettingsStore();

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Settings</h1>
        
        <div className="max-w-md mx-auto bg-gray-800 rounded-lg p-6 shadow-lg min-h-[400px] w-full">
          <div className="mb-8">
            <label className="block text-gray-300 mb-3 font-medium">Difficulty</label>
            <div className="flex flex-col sm:flex-row gap-2">
              {(['easy', 'medium', 'hard'] as const).map((level) => (
                <button
                  key={level}
                  className={`px-4 py-3 rounded-md flex-1 ${
                    difficulty === level
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  onClick={() => setDifficulty(level)}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          <div className="mb-8">
            <label className="block text-gray-300 mb-3 font-medium">
              Memorization Time: {memorizationTime} seconds
            </label>
            <input
              type="range"
              min="5"
              max="30"
              step="5"
              value={memorizationTime}
              onChange={(e) => setMemorizationTime(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>5s</span>
              <span>30s</span>
            </div>
          </div>
          
          <div className="mb-8">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showCoordinates}
                onChange={() => setShowCoordinates(!showCoordinates)}
                className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-600"
              />
              <span className="text-gray-300">Show board coordinates</span>
            </label>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between gap-4 mt-12">
            <Link 
              href="/"
              className="px-4 py-3 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 text-center"
            >
              Back to Home
            </Link>
            <Link 
              href="/game"
              className="px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-center"
            >
              Play Game
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 