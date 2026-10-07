"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { getPieceImageUrl } from "@/utils/chessPieces";
import { BOARD_SQUARES, FILES, RANKS, type SquareName } from "@/lib/game/board";
import { isDarkSquare, type LabPiece, type LabPosition } from "@/lib/home/calibration";

const CORNERS = ["tl", "tr", "bl", "br"] as const;

export type PieceState = "on" | "off" | "ghost";

interface PieceImageProps {
  piece: LabPiece;
  /** Empty for a piece on a board that already carries its own label. */
  alt?: string;
  state?: PieceState;
}

export function PieceImage({ piece, alt = "", state = "on" }: PieceImageProps) {
  return (
    <Image
      src={getPieceImageUrl(piece.type, piece.color)}
      alt={alt}
      width={45}
      height={45}
      sizes="56px"
      className="lab-piece"
      data-state={state}
      draggable={false}
    />
  );
}

/** Localised name of a piece, e.g. "white knight". */
export function usePieceName(): (piece: LabPiece) => string {
  const t = useTranslations("game.board.pieces");
  return (piece) => t(`${piece.color}.${piece.type}`);
}

interface BoardFigureProps {
  children: ReactNode;
  className?: string;
}

/** A board framed as a lab figure: crosshair corners and coordinate rulers. */
export function BoardFigure({ children, className }: BoardFigureProps) {
  return (
    <div className={className ? `lab-figure ${className}` : "lab-figure"}>
      {CORNERS.map((corner) => (
        <span key={corner} className="lab-crosshair" data-corner={corner} aria-hidden="true" />
      ))}
      {children}
      <div className="lab-ranks" aria-hidden="true">
        {RANKS.map((rank) => (
          <span key={rank}>{rank}</span>
        ))}
      </div>
      <div className="lab-files" aria-hidden="true">
        {FILES.map((file) => (
          <span key={file}>{file}</span>
        ))}
      </div>
    </div>
  );
}

interface StaticBoardProps {
  position: LabPosition;
  pieceState?: (square: SquareName) => PieceState;
  mark?: (square: SquareName) => string | undefined;
}

/** A read-only board. It is decorative; the surrounding figure carries the label. */
export function StaticBoard({ position, pieceState, mark }: StaticBoardProps) {
  return (
    <div className="lab-board" aria-hidden="true">
      {BOARD_SQUARES.map((square, index) => {
        const piece = position[square];
        return (
          <div
            key={square}
            className="lab-cell"
            data-dark={isDarkSquare(index) || undefined}
            data-mark={mark?.(square)}
          >
            {piece && <PieceImage piece={piece} state={pieceState?.(square)} />}
          </div>
        );
      })}
    </div>
  );
}
