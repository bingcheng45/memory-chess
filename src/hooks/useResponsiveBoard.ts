'use client';

import { useState, useEffect } from 'react';

interface BoardDimensions {
  size: number;
  squareSize: number;
  pieceSize: number;
  fontSize: {
    coordinates: number;
    pieceSelector: number;
  };
  padding: number;
}

export function useResponsiveBoard(
  minSize: number = 280, 
  maxSize: number = 600,
  statusBarHeight: number = 0, // Height of any status bars or fixed headers
  controlsHeight: number = 0  // Height of game controls
): BoardDimensions {
  const [dimensions, setDimensions] = useState<BoardDimensions>({
    size: maxSize,
    squareSize: maxSize / 8,
    pieceSize: Math.floor(maxSize / 10),
    fontSize: {
      coordinates: 12,
      pieceSelector: 14,
    },
    padding: 10,
  });

  useEffect(() => {
    // Function to calculate optimal dimensions
    function calculateDimensions() {
      if (typeof window === 'undefined') return;

      // Get viewport dimensions
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Subtract fixed heights (status bar, navigation, etc.)
      const availableHeight = viewportHeight - statusBarHeight - controlsHeight;
      
      // Calculate maximum possible square size based on available space
      // Account for padding, borders, and other UI elements
      const maxBoardWidth = viewportWidth * 0.95; // 95% of viewport width
      const maxBoardHeight = availableHeight * 0.7; // 70% of available height
      
      // Use the smaller dimension to ensure the board fits
      let optimalSize = Math.min(maxBoardWidth, maxBoardHeight, maxSize);
      
      // Ensure minimum size
      optimalSize = Math.max(optimalSize, minSize);
      
      // Calculate square size (board divided into 8x8 grid)
      const squareSize = optimalSize / 8;
      
      // Calculate piece size (slightly smaller than square size)
      const pieceSize = Math.floor(squareSize * 0.8);
      
      // Calculate font sizes based on square size
      const coordinateFontSize = Math.max(8, Math.floor(squareSize / 4));
      const pieceSelectorFontSize = Math.max(10, Math.floor(squareSize / 3));
      
      // Calculate padding
      const padding = Math.max(4, Math.floor(squareSize / 8));
      
      setDimensions({
        size: optimalSize,
        squareSize,
        pieceSize,
        fontSize: {
          coordinates: coordinateFontSize,
          pieceSelector: pieceSelectorFontSize,
        },
        padding,
      });
    }

    // Calculate dimensions on initial load
    calculateDimensions();

    // Recalculate on window resize
    window.addEventListener('resize', calculateDimensions);
    
    // Clean up event listener
    return () => {
      window.removeEventListener('resize', calculateDimensions);
    };
  }, [minSize, maxSize, statusBarHeight, controlsHeight]);

  return dimensions;
} 