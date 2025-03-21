'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface TimerOptions {
  duration?: number;
  autoStart?: boolean;
  countDown?: boolean;
  onComplete?: () => void;
  interval?: number;
}

export function useTimer({
  duration = 0,
  autoStart = false,
  countDown = false,
  onComplete,
  interval = 1000
}: TimerOptions = {}) {
  const [time, setTime] = useState(countDown ? duration : 0);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isComplete, setIsComplete] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pausedTimeRef = useRef<number>(0);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (isRunning) return;
    
    setIsRunning(true);
    setIsComplete(false);
    
    startTimeRef.current = Date.now() - pausedTimeRef.current;
    
    timerRef.current = setInterval(() => {
      const elapsedTime = Math.floor((Date.now() - (startTimeRef.current || 0)) / interval);
      
      if (countDown) {
        const remainingTime = duration - elapsedTime;
        setTime(remainingTime > 0 ? remainingTime : 0);
        
        if (remainingTime <= 0) {
          clearTimer();
          setIsRunning(false);
          setIsComplete(true);
          onComplete?.();
        }
      } else {
        setTime(elapsedTime);
        
        if (duration > 0 && elapsedTime >= duration) {
          clearTimer();
          setIsRunning(false);
          setIsComplete(true);
          onComplete?.();
        }
      }
    }, interval);
  }, [isRunning, countDown, duration, interval, clearTimer, onComplete]);

  const pause = useCallback(() => {
    if (!isRunning) return;
    
    clearTimer();
    setIsRunning(false);
    pausedTimeRef.current = Date.now() - (startTimeRef.current || 0);
  }, [isRunning, clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    setIsRunning(false);
    setIsComplete(false);
    setTime(countDown ? duration : 0);
    startTimeRef.current = null;
    pausedTimeRef.current = 0;
  }, [clearTimer, countDown, duration]);

  const toggle = useCallback(() => {
    if (isRunning) {
      pause();
    } else {
      start();
    }
  }, [isRunning, pause, start]);

  // Format time as MM:SS
  const formatTime = useCallback((timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Calculate progress percentage
  const progress = useCallback(() => {
    if (duration <= 0) return 0;
    return countDown 
      ? (time / duration) * 100 
      : (time / duration) * 100;
  }, [countDown, duration, time]);

  // Clean up on unmount
  useEffect(() => {
    if (autoStart) {
      start();
    }
    
    return () => {
      clearTimer();
    };
  }, [autoStart, clearTimer, start]);

  return {
    time,
    isRunning,
    isComplete,
    start,
    pause,
    reset,
    toggle,
    formatTime: () => formatTime(time),
    progress: progress()
  };
} 