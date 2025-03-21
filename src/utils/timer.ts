/**
 * Formats a time in seconds to a string in the format "mm:ss".
 * 
 * @param seconds The time in seconds
 * @returns A formatted string in the format "mm:ss"
 */
export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Calculates the elapsed time in seconds between two timestamps.
 * 
 * @param startTime The start time in milliseconds
 * @param endTime The end time in milliseconds (defaults to now)
 * @returns The elapsed time in seconds
 */
export function calculateElapsedTime(startTime: number, endTime: number = Date.now()): number {
  return (endTime - startTime) / 1000;
}

/**
 * Calculates the remaining time in seconds.
 * 
 * @param totalTime The total time in seconds
 * @param elapsedTime The elapsed time in seconds
 * @returns The remaining time in seconds (0 if elapsed time exceeds total time)
 */
export function calculateRemainingTime(totalTime: number, elapsedTime: number): number {
  return Math.max(0, totalTime - elapsedTime);
}

/**
 * Calculates the progress percentage for a timer.
 * 
 * @param elapsedTime The elapsed time in seconds
 * @param totalTime The total time in seconds
 * @returns The progress percentage (0-100)
 */
export function calculateProgress(elapsedTime: number, totalTime: number): number {
  return Math.min(100, (elapsedTime / totalTime) * 100);
} 