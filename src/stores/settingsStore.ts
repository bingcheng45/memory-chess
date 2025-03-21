import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SettingsState {
  // Game settings
  difficulty: 'easy' | 'medium' | 'hard';
  memorizationTime: number; // in seconds
  showCoordinates: boolean;
  
  // Actions
  setDifficulty: (difficulty: 'easy' | 'medium' | 'hard') => void;
  setMemorizationTime: (time: number) => void;
  setShowCoordinates: (show: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Default settings
      difficulty: 'medium',
      memorizationTime: 10,
      showCoordinates: true,
      
      // Actions
      setDifficulty: (difficulty) => set({ difficulty }),
      setMemorizationTime: (memorizationTime) => set({ memorizationTime }),
      setShowCoordinates: (showCoordinates) => set({ showCoordinates }),
    }),
    {
      name: 'memory-chess-settings',
    }
  )
); 