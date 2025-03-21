'use client';

import { useState, useEffect } from 'react';
import { isSoundEnabled, setSoundEnabled, getVolume, setVolume, playSound } from '@/lib/utils/soundEffects';
import { Button } from '@/components/ui/button';

interface SoundSettingsProps {
  className?: string;
}

export default function SoundSettings({ className = '' }: SoundSettingsProps) {
  const [soundOn, setSoundOn] = useState(true);
  const [volume, setVolumeState] = useState(0.5);
  
  // Initialize state from sound utilities
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSoundOn(isSoundEnabled());
      setVolumeState(getVolume());
    }
  }, []);
  
  // Handle sound toggle
  const handleSoundToggle = () => {
    const newState = !soundOn;
    setSoundOn(newState);
    setSoundEnabled(newState);
    
    if (newState) {
      // Play a sound to confirm sound is on
      playSound('click');
    }
  };
  
  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolumeState(newVolume);
    setVolume(newVolume);
    
    // Play a sound to demonstrate new volume
    if (soundOn) {
      playSound('click');
    }
  };
  
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Button
        onClick={handleSoundToggle}
        variant="outline"
        size="icon"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-light hover:bg-bg-light/80"
        aria-label={soundOn ? 'Mute sound' : 'Unmute sound'}
        title={soundOn ? 'Mute sound' : 'Unmute sound'}
      >
        {soundOn ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <line x1="23" y1="9" x2="17" y2="15"></line>
            <line x1="17" y1="9" x2="23" y2="15"></line>
          </svg>
        )}
      </Button>
      
      {soundOn && (
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className="h-1 w-20 cursor-pointer appearance-none rounded-lg bg-bg-light"
            style={{
              backgroundImage: `linear-gradient(to right, #FFB380 0%, #FFB380 ${volume * 100}%, #222222 ${volume * 100}%, #222222 100%)`
            }}
            aria-label="Volume"
          />
          <span className="text-xs text-text-muted">{Math.round(volume * 100)}%</span>
        </div>
      )}
    </div>
  );
} 