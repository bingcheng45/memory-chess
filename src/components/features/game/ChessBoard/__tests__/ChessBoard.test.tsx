import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChessBoard } from '../ChessBoard';
import { ChessPiece } from '../ChessBoard.types';

// Mock the ChessPiece component to avoid testing its implementation
jest.mock('../ChessPiece', () => ({
  ChessPiece: ({ piece, onClick }: { piece: ChessPiece; onClick: (piece: ChessPiece) => void }) => (
    <div data-testid={`chess-piece-${piece.id}`} onClick={() => onClick(piece)}>
      {piece.symbol}
    </div>
  ),
}));

describe('ChessBoard Component', () => {
  const mockPieces: ChessPiece[] = [
    {
      id: 'piece-1',
      type: 'pawn',
      color: 'white',
      position: { row: 0, col: 0 },
      symbol: '♟',
      isRevealed: false,
      isMatched: false,
    },
    {
      id: 'piece-2',
      type: 'rook',
      color: 'black',
      position: { row: 7, col: 7 },
      symbol: '♜',
      isRevealed: true,
      isMatched: false,
    },
  ];

  it('renders the chess board with correct grid', () => {
    render(<ChessBoard pieces={[]} />);
    
    // The board should have 8x8=64 squares
    const squares = screen.getAllByRole('presentation', { hidden: true });
    expect(squares.length).toBe(64);
  });

  it('renders pieces in the correct positions', () => {
    render(<ChessBoard pieces={mockPieces} />);
    
    const piece1 = screen.getByTestId('chess-piece-piece-1');
    const piece2 = screen.getByTestId('chess-piece-piece-2');
    
    expect(piece1).toBeInTheDocument();
    expect(piece2).toBeInTheDocument();
    expect(piece1.textContent).toBe('♟');
    expect(piece2.textContent).toBe('♜');
  });

  it('calls onPieceClick when a piece is clicked', () => {
    const handlePieceClick = jest.fn();
    render(<ChessBoard pieces={mockPieces} onPieceClick={handlePieceClick} />);
    
    const piece = screen.getByTestId('chess-piece-piece-1');
    fireEvent.click(piece);
    
    expect(handlePieceClick).toHaveBeenCalledTimes(1);
    expect(handlePieceClick).toHaveBeenCalledWith(mockPieces[0]);
  });

  it('calls onSquareClick when a square is clicked', () => {
    const handleSquareClick = jest.fn();
    render(<ChessBoard pieces={[]} onSquareClick={handleSquareClick} />);
    
    // Click the first square (0,0)
    const squares = screen.getAllByRole('presentation', { hidden: true });
    fireEvent.click(squares[0]);
    
    expect(handleSquareClick).toHaveBeenCalledTimes(1);
    expect(handleSquareClick).toHaveBeenCalledWith({ row: 0, col: 0 });
  });

  it('highlights the selected piece', () => {
    render(
      <ChessBoard 
        pieces={mockPieces} 
        selectedPiece={mockPieces[0]}
      />
    );
    
    // The square containing the selected piece should have a ring
    const squares = screen.getAllByRole('presentation', { hidden: true });
    expect(squares[0]).toHaveClass('ring-2');
    expect(squares[0]).toHaveClass('ring-blue-500');
  });
}); 