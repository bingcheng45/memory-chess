'use client';

import { useEffect, useState } from 'react';

/**
 * Width, in pixels, below which the active game uses its compact layout.
 * Matches Tailwind's `sm` breakpoint so the JS sizing and the `sm:` classes
 * that shrink the chrome switch at the same point.
 */
export const SMALL_SCREEN_MAX_WIDTH = 640;

/**
 * Vertical space the active game screen needs for everything that is not the
 * board: header, timer row, piece palette and the page's own padding.
 *
 * The board is square, so it takes the smaller of the width and height
 * budgets -- on a phone the height budget is the smaller one, which means
 * this number, not the gutter, is what decides how wide the board gets.
 * The compact layout trims the timer row and the page padding, so it reserves
 * correspondingly less.
 */
export const ACTIVE_GAME_RESERVED_HEIGHT = 384;
export const ACTIVE_GAME_RESERVED_HEIGHT_COMPACT = 360;

/**
 * Horizontal gutter between the page content and the screen edge on small
 * screens, in pixels. Matches the `px-1` the page containers use below the
 * `sm` breakpoint, so the board lines up with the header and everything else.
 */
export const SMALL_SCREEN_GUTTER = 4;

export const ACTIVE_GAME_FRAME_WIDTH = `max(280px, min(calc(100vw - ${SMALL_SCREEN_GUTTER * 2}px), calc(100dvh - ${ACTIVE_GAME_RESERVED_HEIGHT}px), 600px))`;

export interface BoardDimensions {
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
  reservedHeight: number = 0
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
      
      const isSmallScreen = viewportWidth < SMALL_SCREEN_MAX_WIDTH;

      // Keep enough room for the page header and active-game controls. The
      // compact layout shows a shorter timer row and tighter page padding, so
      // it hands the board back what it no longer needs.
      const availableHeight =
        viewportHeight -
        (isSmallScreen
          ? Math.min(reservedHeight, ACTIVE_GAME_RESERVED_HEIGHT_COMPACT)
          : reservedHeight);

      // Calculate the largest square that fits the shared gameplay frame.
      // Small screens reserve a fixed gutter so the board sits flush with the
      // rest of the page rather than shrinking proportionally as the screen
      // narrows; wider screens keep the proportional inset.
      const maxBoardWidth = isSmallScreen
        ? viewportWidth - SMALL_SCREEN_GUTTER * 2
        : viewportWidth * 0.95;
      const maxBoardHeight = availableHeight;
      
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
  }, [minSize, maxSize, reservedHeight]);

  return dimensions;
}
