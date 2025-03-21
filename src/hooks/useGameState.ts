'use client';

import { useState, useCallback } from 'react';
import { useGameStore } from '../stores/gameStore';
import { ChessPiece, PieceType, PieceColor, Position } from '../types/chess';
import { GamePhase } from '../types/game';
import { v4 as uuidv4 } from 'uuid';

export function useGameState() {
  const gameState = useGameStore();
  const [selectedPieceType, setSelectedPieceType] = useState<PieceType>('pawn');
  const [selectedColor, setSelectedColor] = useState<PieceColor>('white');
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  
  // Handle piece type selection
  const selectPieceType = useCallback((type: PieceType) => {
    setSelectedPieceType(type);
  }, []);
  
  // Toggle the selected color
  const toggleColor = useCallback(() => {
    setSelectedColor(prev => prev === 'white' ? 'black' : 'white');
  }, []);
  
  // Handle position selection
  const selectPosition = useCallback((position: Position) => {
    setSelectedPosition(position);
  }, []);
  
  // Place a piece on the board
  const placePiece = useCallback((position: Position) => {
    if (gameState.phase !== GamePhase.SOLUTION) return;
    
    const piece: ChessPiece = {
      id: uuidv4(),
      type: selectedPieceType,
      color: selectedColor,
      position
    };
    
    gameState.placePiece(piece);
  }, [gameState, selectedPieceType, selectedColor]);
  
  // Remove a piece from the board
  const removePiece = useCallback((position: Position) => {
    if (gameState.phase !== GamePhase.SOLUTION) return;
    
    gameState.removePiece(position);
  }, [gameState]);
  
  // Handle square click
  const handleSquareClick = useCallback((position: Position) => {
    if (gameState.phase !== GamePhase.SOLUTION) return;
    
    // Check if there's already a piece at this position
    const existingPiece = gameState.playerSolution.find(
      p => p.position.file === position.file && p.position.rank === position.rank
    );
    
    if (existingPiece) {
      // If there's a piece, remove it
      removePiece(position);
    } else {
      // If there's no piece, place one
      placePiece(position);
    }
    
    setSelectedPosition(position);
  }, [gameState, placePiece, removePiece]);
  
  // Start the game
  const startGame = useCallback(() => {
    gameState.startGame();
  }, [gameState]);
  
  // End the memorization phase
  const endMemorization = useCallback(() => {
    gameState.endMemorization();
  }, [gameState]);
  
  // Submit the solution
  const submitSolution = useCallback(() => {
    gameState.submitSolution();
  }, [gameState]);
  
  // Reset the game
  const resetGame = useCallback(() => {
    gameState.resetGame();
  }, [gameState]);
  
  return {
    ...gameState,
    selectedPieceType,
    selectedColor,
    selectedPosition,
    selectPieceType,
    toggleColor,
    selectPosition,
    handleSquareClick,
    startGame,
    endMemorization,
    submitSolution,
    resetGame
  };
} 