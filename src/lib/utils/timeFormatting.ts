export function formatTimeParts(milliseconds: number): { minutes: string; seconds: string; milliseconds: string } {
  // Convert milliseconds to components
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  const ms = (milliseconds % 1000).toString().padStart(3, '0');
  
  // Debug the components
  console.log(`formatTimeParts: ${milliseconds}ms → min:${minutes}, sec:${seconds}, ms:${ms}`);
  
  return {
    minutes,
    seconds,
    milliseconds: ms
  };
}

export function formatTimeDisplay(milliseconds: number): string {
  const { minutes, seconds, milliseconds: ms } = formatTimeParts(milliseconds);
  // Ensure proper formatting with colons
  const formatted = `${minutes}:${seconds}:${ms}`;
  console.log(`formatTimeDisplay: ${formatted}`);
  return formatted;
}

export function formatMemorizeTime(seconds: number): string {
  // For memorize time, we're dealing with seconds directly, not milliseconds
  // Convert seconds to milliseconds for the formatTimeParts function
  const milliseconds = seconds * 1000;
  const { minutes, seconds: formattedSeconds, milliseconds: ms } = formatTimeParts(milliseconds);
  
  // Ensure proper formatting with colons
  const formatted = `${minutes}:${formattedSeconds}:${ms}`;
  console.log(`formatMemorizeTime: ${formatted}`);
  return formatted;
}

export function formatSolutionTime(seconds: number): string {
  // For solution time, we're dealing with seconds directly, not milliseconds
  // Convert seconds to milliseconds for the formatTimeParts function
  const milliseconds = seconds * 1000;
  const { minutes, seconds: formattedSeconds, milliseconds: ms } = formatTimeParts(milliseconds);
  
  // Ensure proper formatting with colons
  const formatted = `${minutes}:${formattedSeconds}:${ms}`;
  console.log(`formatSolutionTime: ${formatted}`);
  return formatted;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
} 