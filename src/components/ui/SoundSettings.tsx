'use client';

import { useState, useEffect, useRef } from 'react';
import { isSoundEnabled, setSoundEnabled, getVolume, setVolume, playSound } from '@/lib/utils/soundEffects';
import { motion, AnimatePresence } from 'framer-motion';
import { useClickAway } from '@/hooks/useClickAway';

interface SoundSettingsProps {
  className?: string;
}

export default function SoundSettings({ className = '' }: SoundSettingsProps) {
  const [soundOn, setSoundOn] = useState(true);
  const [volume, setVolumeState] = useState(1); // Default to 100% for mobile
  const [showSlider, setShowSlider] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isHovering, setIsHovering] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const sliderTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if device is mobile
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 640); // Same breakpoint as sm: in Tailwind
      };
      
      checkMobile();
      window.addEventListener('resize', checkMobile);
      
      return () => {
        window.removeEventListener('resize', checkMobile);
      };
    }
  }, []);

  // Initialize state from sound utilities
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const enabled = isSoundEnabled();
      setSoundOn(enabled);
      
      // On mobile, we only use 0% or 100% volume
      if (isMobile) {
        setVolumeState(1); // Always 100% on mobile when sound is on
        setVolume(1);
      } else {
        setVolumeState(getVolume());
      }
    }
  }, [isMobile]);

  // Auto-dismiss slider after inactivity (desktop only)
  useEffect(() => {
    if (!isMobile && showSlider && !isHovering) {
      if (sliderTimeoutRef.current) {
        clearTimeout(sliderTimeoutRef.current);
      }
      
      sliderTimeoutRef.current = setTimeout(() => {
        setShowSlider(false);
      }, 3000);
    }
    
    return () => {
      if (sliderTimeoutRef.current) {
        clearTimeout(sliderTimeoutRef.current);
      }
    };
  }, [showSlider, isHovering, isMobile]);

  // Handle clicks outside to close the slider
  useClickAway(wrapperRef, () => {
    if (showSlider) {
      setShowSlider(false);
    }
  });

  // Show toast notification
  const showToastNotification = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    
    setTimeout(() => {
      setShowToast(false);
    }, 1500);
  };

  // Handle sound toggle
  const handleSoundToggle = () => {
    const newState = !soundOn;
    setSoundOn(newState);
    setSoundEnabled(newState);
    
    if (newState) {
      // On mobile, set volume to 100% when toggling on
      if (isMobile) {
        setVolumeState(1);
        setVolume(1);
      }
      
      // Play a sound to confirm sound is on
      playSound('click');
      showToastNotification('Sound On');
    } else {
      showToastNotification('Sound Off');
    }
  };

  // Handle volume change (desktop only)
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolumeState(newVolume);
    setVolume(newVolume);
    
    // Play a sound to demonstrate new volume
    if (soundOn && (newVolume > 0)) {
      playSound('click');
    }
  };

  const handleMouseEnter = () => {
    if (!isMobile) {
      setIsHovering(true);
      // On desktop, show slider on hover
      setShowSlider(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setIsHovering(false);
    }
  };

  return (
    <div 
      ref={wrapperRef}
      className={`relative flex justify-end ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Sound toggle button */}
      <motion.button
        onClick={handleSoundToggle}
        whileTap={{ scale: 0.9 }}
        className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-bg-card/30 backdrop-blur-sm hover:bg-bg-card/50 transition-all ml-auto"
        aria-label={soundOn ? 'Mute sound' : 'Unmute sound'}
        title={soundOn ? 'Mute sound' : 'Unmute sound'}
      >
        <motion.div
          initial={{ scale: 1 }}
          animate={{ 
            scale: [1, 1.2, 1],
            color: soundOn ? 'var(--peach-500)' : 'var(--text-secondary)'
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          key={soundOn ? 'sound-on' : 'sound-off'}
        >
          {soundOn ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <line x1="23" y1="9" x2="17" y2="15"></line>
              <line x1="17" y1="9" x2="23" y2="15"></line>
            </svg>
          )}
        </motion.div>
      </motion.button>

      {/* Volume slider - Desktop Only */}
      <AnimatePresence>
        {!isMobile && showSlider && soundOn && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute p-3 bg-bg-card/90 backdrop-blur-sm rounded-lg shadow-lg z-10"
            style={{ 
              top: '100%',
              right: 0,
              marginTop: '8px',
              width: 'max-content'
            }}
          >
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={handleVolumeChange}
                className="h-1.5 w-24 cursor-pointer appearance-none rounded-lg bg-bg-light"
                style={{
                  backgroundImage: `linear-gradient(to right, #FFB380 0%, #FFB380 ${volume * 100}%, #222222 ${volume * 100}%, #222222 100%)`
                }}
                aria-label="Volume"
              />
              <span className="text-sm font-medium text-text-primary">{Math.round(volume * 100)}%</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-10 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-bg-dark/80 text-text-primary rounded-full shadow-lg backdrop-blur-sm z-50"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 