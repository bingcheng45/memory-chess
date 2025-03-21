'use client';

import { useEffect, useCallback } from 'react';
import { PieceType } from '../types/chess';

interface KeyboardControlsOptions {
  onPieceSelect?: (type: PieceType) => void;
  onColorToggle?: () => void;
  onPlacePiece?: () => void;
  onRemovePiece?: () => void;
  onSubmit?: () => void;
  onNavigate?: (direction: 'up' | 'down' | 'left' | 'right') => void;
  disabled?: boolean;
}

export function useKeyboardControls({
  onPieceSelect,
  onColorToggle,
  onPlacePiece,
  onRemovePiece,
  onSubmit,
  onNavigate,
  disabled = false
}: KeyboardControlsOptions = {}) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (disabled) return;
    
    // Ignore key events when focus is in an input element
    if (
      document.activeElement instanceof HTMLInputElement ||
      document.activeElement instanceof HTMLTextAreaElement ||
      document.activeElement instanceof HTMLSelectElement
    ) {
      return;
    }
    
    switch (event.key) {
      // Piece selection (1-6)
      case '1':
        onPieceSelect?.('pawn');
        break;
      case '2':
        onPieceSelect?.('knight');
        break;
      case '3':
        onPieceSelect?.('bishop');
        break;
      case '4':
        onPieceSelect?.('rook');
        break;
      case '5':
        onPieceSelect?.('queen');
        break;
      case '6':
        onPieceSelect?.('king');
        break;
      
      // Color toggle (spacebar)
      case ' ':
        event.preventDefault(); // Prevent page scroll
        onColorToggle?.();
        break;
      
      // Place/remove piece (Enter/Delete)
      case 'Enter':
        onPlacePiece?.();
        break;
      case 'Delete':
      case 'Backspace':
        onRemovePiece?.();
        break;
      
      // Submit (S)
      case 's':
        onSubmit?.();
        break;
      
      // Navigation (arrow keys)
      case 'ArrowUp':
        event.preventDefault(); // Prevent page scroll
        onNavigate?.('up');
        break;
      case 'ArrowDown':
        event.preventDefault(); // Prevent page scroll
        onNavigate?.('down');
        break;
      case 'ArrowLeft':
        event.preventDefault(); // Prevent page scroll
        onNavigate?.('left');
        break;
      case 'ArrowRight':
        event.preventDefault(); // Prevent page scroll
        onNavigate?.('right');
        break;
    }
  }, [
    disabled,
    onPieceSelect,
    onColorToggle,
    onPlacePiece,
    onRemovePiece,
    onSubmit,
    onNavigate
  ]);
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
  
  // Return a mapping of keys to their functions for documentation
  return {
    keyMap: {
      '1': 'Select Pawn',
      '2': 'Select Knight',
      '3': 'Select Bishop',
      '4': 'Select Rook',
      '5': 'Select Queen',
      '6': 'Select King',
      'Spacebar': 'Toggle Piece Color',
      'Enter': 'Place Piece',
      'Delete/Backspace': 'Remove Piece',
      'S': 'Submit Solution',
      'Arrow Keys': 'Navigate Board'
    }
  };
} 