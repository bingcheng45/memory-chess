/**
 * Formats elapsed time as "mm:ss.mmm" for a smoothly updating count-up timer.
 */
export function formatTimeWithMilliseconds(seconds: number): string {
  if (typeof seconds !== 'number' || isNaN(seconds) || !isFinite(seconds)) {
    seconds = 0;
  }

  const totalMilliseconds = Math.floor(Math.max(0, seconds) * 1000);
  const minutes = Math.floor(totalMilliseconds / 60000);
  const remainingSeconds = Math.floor((totalMilliseconds % 60000) / 1000);
  const milliseconds = totalMilliseconds % 1000;

  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
}

/** Milliseconds as seconds with one decimal: 4230 reads "4.2". */
export function formatSeconds(ms: number): string {
  return (ms / 1000).toFixed(1);
}

/** Milliseconds as seconds with three decimals: 9873 reads "9.873". */
export function formatSecondsMs(ms: number): string {
  return (Math.max(0, ms) / 1000).toFixed(3);
}
