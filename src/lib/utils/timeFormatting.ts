export function formatTimeParts(seconds: number): { minutes: string; seconds: string; milliseconds: string } {
  const wholeSeconds = Math.floor(seconds);
  const minutes = Math.floor(wholeSeconds / 60).toString().padStart(2, '0');
  const remainingSeconds = (wholeSeconds % 60).toString().padStart(2, '0');
  const ms = Math.floor((seconds - wholeSeconds) * 1000).toString().padStart(3, '0');
  
  return {
    minutes,
    seconds: remainingSeconds,
    milliseconds: ms
  };
}

export function formatTimeDisplay(seconds: number): string {
  const { minutes, seconds: secs, milliseconds } = formatTimeParts(seconds);
  return `${minutes}:${secs}.${milliseconds.substring(0, 1)}`;
}

export function formatMemorizeTime(seconds: number): string {
  const { minutes, seconds: secs, milliseconds } = formatTimeParts(seconds);
  return `${minutes}:${secs}.${milliseconds.substring(0, 1)}`;
}

export function formatSolutionTime(seconds: number): string {
  const { minutes, seconds: secs, milliseconds } = formatTimeParts(seconds);
  return `${minutes}:${secs}.${milliseconds.substring(0, 1)}`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
} 