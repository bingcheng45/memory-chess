/**
 * Game Commands
 * 
 * Implements the Command pattern for game actions.
 * This allows for features like undo/redo and action history.
 */

import { Chess, Square, PieceSymbol, Color } from 'chess.js';

/**
 * Interface for all game commands
 */
interface Command {
  /**
   * Execute the command
   */
  execute(): void;
  
  /**
   * Undo the command
   */
  undo(): void;
  
  /**
   * Get a description of the command
   */
  getDescription(): string;
}

/**
 * Command for placing a piece on the board
 */
export class PlacePieceCommand implements Command {
  private previousPiece: ReturnType<Chess['get']> | null = null;
  
  /**
   * @param chess - Chess instance to modify
   * @param piece - Piece to place (e.g., 'wP' for white pawn)
   * @param square - Square to place the piece on (e.g., 'e4')
   */
  constructor(
    private chess: Chess,
    private piece: { type: PieceSymbol, color: Color },
    private square: Square
  ) {}
  
  execute(): void {
    // Store the previous piece at this square (if any) for undo
    this.previousPiece = this.chess.get(this.square);
    
    // Place the new piece
    this.chess.put(this.piece, this.square);
  }
  
  undo(): void {
    // Remove the piece we placed
    this.chess.remove(this.square);
    
    // If there was a piece before, restore it
    if (this.previousPiece) {
      this.chess.put(this.previousPiece, this.square);
    }
  }
  
  getDescription(): string {
    const pieceName = `${this.piece.color === 'w' ? 'White' : 'Black'} ${this.getPieceName(this.piece.type)}`;
    return `Place ${pieceName} on ${this.square}`;
  }
  
  private getPieceName(type: PieceSymbol): string {
    const pieceNames: Record<PieceSymbol, string> = {
      'p': 'Pawn',
      'n': 'Knight',
      'b': 'Bishop',
      'r': 'Rook',
      'q': 'Queen',
      'k': 'King'
    };
    
    return pieceNames[type] || 'Piece';
  }
}

/**
 * Command for removing a piece from the board
 */
export class RemovePieceCommand implements Command {
  private removedPiece: ReturnType<Chess['get']> | null = null;
  
  /**
   * @param chess - Chess instance to modify
   * @param square - Square to remove the piece from
   */
  constructor(
    private chess: Chess,
    private square: Square
  ) {}
  
  execute(): void {
    // Store the piece we're removing for undo
    this.removedPiece = this.chess.get(this.square);
    
    // Remove the piece
    if (this.removedPiece) {
      this.chess.remove(this.square);
    }
  }
  
  undo(): void {
    // Restore the removed piece
    if (this.removedPiece) {
      this.chess.put(this.removedPiece, this.square);
    }
  }
  
  getDescription(): string {
    const piece = this.removedPiece;
    if (!piece) return `Remove piece from ${this.square}`;
    
    const pieceName = `${piece.color === 'w' ? 'White' : 'Black'} ${this.getPieceName(piece.type)}`;
    return `Remove ${pieceName} from ${this.square}`;
  }
  
  private getPieceName(type: string): string {
    const pieceNames: Record<string, string> = {
      'p': 'Pawn',
      'n': 'Knight',
      'b': 'Bishop',
      'r': 'Rook',
      'q': 'Queen',
      'k': 'King'
    };
    
    return pieceNames[type.toLowerCase()] || 'Piece';
  }
}

/**
 * Command for moving a piece on the board
 */
export class MovePieceCommand implements Command {
  private moveResult: ReturnType<Chess['move']> | null = null;
  
  /**
   * @param chess - Chess instance to modify
   * @param from - Source square
   * @param to - Destination square
   * @param promotion - Promotion piece (optional)
   */
  constructor(
    private chess: Chess,
    private from: Square,
    private to: Square,
    private promotion?: 'n' | 'b' | 'r' | 'q'
  ) {}
  
  execute(): void {
    try {
      // Attempt to make the move
      this.moveResult = this.chess.move({
        from: this.from,
        to: this.to,
        promotion: this.promotion
      });
    } catch {
      // Invalid move
      this.moveResult = null;
    }
  }
  
  undo(): void {
    if (this.moveResult) {
      // Undo the move
      this.chess.undo();
    }
  }
  
  getDescription(): string {
    return `Move piece from ${this.from} to ${this.to}`;
  }
  
  /**
   * Check if the move was successful
   */
  isSuccessful(): boolean {
    return this.moveResult !== null;
  }
}

/**
 * Command for resetting the board to a specific position
 */
export class SetPositionCommand implements Command {
  private previousPosition: string;
  
  /**
   * @param chess - Chess instance to modify
   * @param position - FEN string or position object
   */
  constructor(
    private chess: Chess,
    private position: string
  ) {
    // Store the current position for undo
    this.previousPosition = chess.fen();
  }
  
  execute(): void {
    this.chess.load(this.position);
  }
  
  undo(): void {
    this.chess.load(this.previousPosition);
  }
  
  getDescription(): string {
    return 'Set board position';
  }
}

/**
 * Command manager that tracks command history and supports undo/redo
 */
export class CommandManager {
  private history: Command[] = [];
  private redoStack: Command[] = [];
  
  /**
   * Execute a command and add it to the history
   */
  execute(command: Command): void {
    command.execute();
    this.history.push(command);
    
    // Clear the redo stack when a new command is executed
    this.redoStack = [];
  }
  
  /**
   * Undo the last command
   */
  undo(): boolean {
    const command = this.history.pop();
    if (!command) return false;
    
    command.undo();
    this.redoStack.push(command);
    return true;
  }
  
  /**
   * Redo the last undone command
   */
  redo(): boolean {
    const command = this.redoStack.pop();
    if (!command) return false;
    
    command.execute();
    this.history.push(command);
    return true;
  }
  
  /**
   * Get the command history
   */
  getHistory(): Command[] {
    return [...this.history];
  }
  
  /**
   * Clear the command history
   */
  clearHistory(): void {
    this.history = [];
    this.redoStack = [];
  }
  
  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.history.length > 0;
  }
  
  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }
} 