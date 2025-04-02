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

export function formatTimeDisplay(milliseconds: number): string {
  const { minutes, seconds, milliseconds: ms } = formatTimeParts(milliseconds);
  return `${minutes}:${seconds}:${ms}`;
}

export function formatMemorizeTime(milliseconds: number): string {
  const { minutes, seconds, milliseconds: ms } = formatTimeParts(milliseconds);
  return `${minutes}:${seconds}:${ms}`;
}

export function formatSolutionTime(milliseconds: number): string {
  const { minutes, seconds, milliseconds: ms } = formatTimeParts(milliseconds);
  return `${minutes}:${seconds}:${ms}`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
} 