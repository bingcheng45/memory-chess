import { useEffect } from "react";
import { labPositionFromFen, type LabPiece } from "@/lib/round/round";
import { getPieceImageUrl } from "@/utils/chessPieces";

/**
 * Fetches and decodes the images a position's pieces use while it is still hidden, so study opens on a painted board.
 * Left to the board, a cold cache showed the study clock running over empty squares while the images arrived.
 */
export function usePreloadPieces(fen: string | null): void {
  useEffect(() => {
    if (fen === null) return;
    const pieces = Object.values(labPositionFromFen(fen)).filter((piece): piece is LabPiece => piece !== undefined);
    for (const url of new Set(pieces.map((piece) => getPieceImageUrl(piece.type, piece.color)))) {
      const image = new Image();
      image.src = url;
      // Older engines have no decode(); the fetch alone still warms the cache.
      image.decode?.().catch(() => {});
    }
  }, [fen]);
}
