'use client';

import { useState, useEffect } from 'react';
import { toggleSound } from '@/lib/utils/sound';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

interface SoundToggleProps {
  className?: string;
}

export function SoundToggle({ className }: SoundToggleProps) {
  const [isEnabled, setIsEnabled] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  // Check if component is mounted (for portal)
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Show toast notification
  const showToastNotification = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    
    // Automatically hide the toast after 1.5 seconds
    setTimeout(() => {
      setShowToast(false);
    }, 1500);
  };

  const handleToggle = () => {
    // If a toast is currently showing, hide it first
    if (showToast) {
      setShowToast(false);
    }
    
    const newState = !isEnabled;
    setIsEnabled(newState);
    toggleSound(newState);
    
    // Show toast notification
    showToastNotification(newState ? 'Sound On' : 'Sound Off');
  };

  return (
    <>
      <button
        className={cn(
          'p-2 rounded-full transition-colors duration-200',
          isEnabled ? 'text-white' : 'text-gray-400',
          className
        )}
        onClick={handleToggle}
        title={isEnabled ? 'Mute sound effects' : 'Unmute sound effects'}
      >
        {isEnabled ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M12 6L7.5 9H4v6h3.5L12 18V6z"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
            />
          </svg>
        )}
      </button>

      {/* Toast notification - Rendered via Portal */}
      {isMounted && showToast && createPortal(
        <div className="fixed left-0 top-0 w-screen h-screen flex items-center justify-center pointer-events-none z-[99999]">
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 30
              }}
              className="px-6 py-3 bg-black/85 text-white rounded-full shadow-xl backdrop-blur-md text-sm font-medium"
            >
              {toastMessage}
            </motion.div>
          </AnimatePresence>
        </div>,
        document.body
      )}
    </>
  );
} 