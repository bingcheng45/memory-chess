export function formatTimeParts(milliseconds: number): { minutes: string; seconds: string; milliseconds: string } {
  // Convert milliseconds to components
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  const ms = (milliseconds % 1000).toString().padStart(3, '0');
  
  return {
    minutes,
    seconds,
    milliseconds: ms
  };
}

export function formatTimeDisplay(seconds: number): string {
  const { minutes, seconds: secs, milliseconds } = formatTimeParts(seconds);
  return `${minutes}:${secs}:${milliseconds}`;
}

export function formatMemorizeTime(seconds: number): string {
  const { minutes, seconds: secs, milliseconds } = formatTimeParts(seconds);
  return `${minutes}:${secs}:${milliseconds}`;
}

export function formatSolutionTime(seconds: number): string {
  const { minutes, seconds: secs, milliseconds } = formatTimeParts(seconds);
  return `${minutes}:${secs}:${milliseconds}`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
} 