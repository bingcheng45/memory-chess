'use client';

import { motion } from 'framer-motion';

export const GAME_SUBMISSION_FLASH_DURATION_MS = 1000;
const transitionDurationSeconds = GAME_SUBMISSION_FLASH_DURATION_MS / 1000;

export default function GameSubmissionFlash() {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
      role="status"
      aria-live="assertive"
      aria-label="Game complete"
    >
      <motion.div
        className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-white"
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: [0, 1, 0], scaleX: [0, 1, 1] }}
        transition={{ duration: transitionDurationSeconds, times: [0, 0.25, 1], ease: 'easeOut' }}
        style={{ boxShadow: '0 0 12px 4px rgba(255, 179, 128, 0.9)' }}
        aria-hidden="true"
      />

      <svg
        className="absolute left-0 top-1/2 h-24 w-full -translate-y-1/2"
        viewBox="0 0 1000 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="game-lightning-gradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#FFB380" stopOpacity="0" />
            <stop offset="35%" stopColor="#FFB380" />
            <stop offset="50%" stopColor="#FFFFFF" />
            <stop offset="65%" stopColor="#FFB380" />
            <stop offset="100%" stopColor="#FFB380" stopOpacity="0" />
          </linearGradient>
          <filter id="game-lightning-glow" x="-20%" y="-200%" width="140%" height="500%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <motion.path
          d="M 0 50 L 330 50 L 375 34 L 410 64 L 455 20 L 490 70 L 525 38 L 565 58 L 615 42 L 670 50 L 1000 50"
          fill="none"
          stroke="url(#game-lightning-gradient)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#game-lightning-glow)"
          initial={{ opacity: 0, pathLength: 0 }}
          animate={{ opacity: [0, 1, 0], pathLength: [0, 1, 1] }}
          transition={{ duration: transitionDurationSeconds, times: [0, 0.35, 1], ease: 'easeOut' }}
        />
      </svg>

      <motion.span
        className="relative text-4xl font-black tracking-[0.22em] text-white drop-shadow-[0_0_12px_rgba(255,179,128,1)] sm:text-5xl"
        initial={{ opacity: 0, scale: 0.65 }}
        animate={{ opacity: [0, 1, 1, 0], scale: [0.65, 1.08, 1, 1] }}
        transition={{ duration: transitionDurationSeconds, times: [0, 0.25, 0.7, 1], ease: 'easeOut' }}
      >
        GAME!
      </motion.span>
    </div>
  );
}
