"use client";

import { useMemo } from "react";
import { useResponsiveBoard } from "@/hooks/useResponsiveBoard";
import { fenToChessPieces } from "@/utils/chessPieces";
import { comparePositions } from "@/utils/positionComparator";
import ResponsiveChessBoard, {
  type SquareFeedbackMap,
  type SquareFeedbackStatus,
} from "./ResponsiveChessBoard";

interface ResultBoardComparisonProps {
  readonly originalPosition?: string;
  readonly userPosition?: string;
}

const positionKey = (file: number, rank: number) => `${file}-${rank}`;

export default function ResultBoardComparison({
  originalPosition,
  userPosition,
}: ResultBoardComparisonProps) {
  const dimensions = useResponsiveBoard(280, 420);

  const comparison = useMemo(() => {
    if (!originalPosition || !userPosition) return null;

    try {
      const originalPieces = fenToChessPieces(originalPosition);
      const userPieces = fenToChessPieces(userPosition);
      const result = comparePositions(originalPieces, userPieces);
      const feedback: Record<string, SquareFeedbackStatus> = {};

      result.correctPlacements.forEach((piece) => {
        feedback[positionKey(piece.position.file, piece.position.rank)] =
          "correct";
      });

      result.missingPieces.forEach((piece) => {
        feedback[positionKey(piece.position.file, piece.position.rank)] =
          "missing";
      });

      // A wrong piece on a target square takes precedence over the missing marker.
      result.incorrectPlacements.forEach((piece) => {
        feedback[positionKey(piece.position.file, piece.position.rank)] =
          "incorrect";
      });

      return {
        originalPieces,
        userPieces,
        feedback: feedback as SquareFeedbackMap,
      };
    } catch {
      return null;
    }
  }, [originalPosition, userPosition]);

  if (!comparison) {
    return (
      <section
        aria-label="Board comparison"
        className="w-full rounded-lg border border-bg-light bg-bg-card/60 px-4 py-6 text-center"
      >
        <h3 className="text-lg font-semibold text-text-primary">
          Review Your Position
        </h3>
        <p className="mt-1 text-sm text-text-secondary">
          Board comparison unavailable.
        </p>
      </section>
    );
  }

  const boardFrameStyle = {
    width: `${dimensions.size}px`,
    maxWidth: "100%",
  };

  return (
    <section aria-labelledby="result-comparison-heading" className="w-full">
      <div className="mb-4 text-center">
        <h3
          id="result-comparison-heading"
          className="text-xl font-bold text-text-primary sm:text-2xl"
        >
          Review Your Position
        </h3>
        <p className="mt-1 text-sm text-text-secondary">
          Compare what you memorized with what you submitted.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-text-secondary sm:text-sm">
        <span className="inline-flex items-center gap-1.5">
          <span
            className="h-3 w-3 rounded-sm border-2 border-green-500"
            aria-hidden="true"
          />
          Correct
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="h-3 w-3 rounded-sm border-2 border-red-500"
            aria-hidden="true"
          />
          Incorrect
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="flex h-3 w-3 items-center justify-center rounded-sm border border-amber-500 bg-transparent"
            aria-hidden="true"
          >
            <span className="h-1.5 w-1.5 rounded-[1px] border border-dotted border-black" />
          </span>
          Missed
        </span>
      </div>

      <div className="grid w-full grid-cols-1 justify-items-center gap-6 lg:grid-cols-2 lg:gap-6">
        <figure
          className="flex w-full flex-col items-center"
          data-result-board="target"
        >
          <figcaption className="mb-2 flex h-8 items-center text-sm font-semibold text-text-primary sm:text-base">
            Position to Remember
          </figcaption>
          <div style={boardFrameStyle}>
            <ResponsiveChessBoard
              pieces={comparison.originalPieces}
              isInteractive={false}
              showCoordinates={true}
              dimensions={dimensions}
            />
          </div>
        </figure>

        <figure
          className="flex w-full flex-col items-center"
          data-result-board="submitted"
        >
          <figcaption className="mb-2 flex h-8 items-center text-sm font-semibold text-text-primary sm:text-base">
            Your Submitted Position
          </figcaption>
          <div style={boardFrameStyle}>
            <ResponsiveChessBoard
              pieces={comparison.userPieces}
              isInteractive={false}
              showCoordinates={true}
              dimensions={dimensions}
              squareFeedback={comparison.feedback}
            />
          </div>
        </figure>
      </div>
    </section>
  );
}
