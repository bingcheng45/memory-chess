import { Chess, SQUARES, validateFen } from "chess.js";
import type { SetBoard } from "@/lib/types/game";
import { localDayOf, type RoundRecord } from "./record";
import { readReviewOpened, REVIEW_OPENED_KEY, reviewKey, reviewQueue } from "./review";
import { labStore } from "./storage";

/** Far more steps than one player's queue holds at once, so a marker is only dropped long after its board has left the queue. */
const OPENED_KEEP = 50;

export type ReviewBoard = Extract<SetBoard, { kind: "review" }>;

export type ReviewStart =
  | { readonly kind: "play"; readonly pieceCount: number; readonly memorizeTime: number; readonly board: ReviewBoard }
  | { readonly kind: "none" };

/** The record keeps only a board's placement. The game's generator gives the move to a side in check, so this does too. */
function playableFen(board: string): string {
  const chess = new Chess(`${board} w - - 0 1`, { skipValidation: true });
  const blackKing = SQUARES.find((square) => {
    const piece = chess.get(square);
    return piece?.type === "k" && piece.color === "b";
  });
  return `${board} ${blackKing && chess.isAttacked(blackKing, "w") ? "b" : "w"} - - 0 1`;
}

/** An imported file is checked for shape, not for a legal position, so a due board the game cannot load is passed over. */
export function reviewStart(records: readonly RoundRecord[], at: number, opened: ReadonlySet<string>): ReviewStart {
  for (const { reviewOf, firstDay, step, fen, pieceCount, memorizeSeconds } of reviewQueue(records, localDayOf(new Date(at)), opened).due) {
    const playable = playableFen(fen);
    if (validateFen(playable).ok) {
      return { kind: "play", pieceCount, memorizeTime: memorizeSeconds, board: { kind: "review", fen: playable, reviewOf, firstDay, step } };
    }
  }
  return { kind: "none" };
}

/** Reads the record on this device for the board due next. Marks nothing: only the caller that starts the round knows it is played. */
export async function openReview(at: number): Promise<ReviewStart> {
  const store = labStore();
  const records = store && (await store.isAvailable()) ? await store.listRounds() : [];
  return reviewStart(records, at, readReviewOpened());
}

export function markReviewOpened({ reviewOf, step }: ReviewBoard): void {
  const key = reviewKey(reviewOf, step);
  const kept = [...readReviewOpened()].filter((opened) => opened !== key);
  try {
    window.localStorage.setItem(REVIEW_OPENED_KEY, JSON.stringify([...kept, key].slice(-OPENED_KEEP)));
  } catch {
    // Without storage a review left before its result can be opened again, as every round could before.
  }
}
