import { validateFen } from "chess.js";
import type { SetBoard } from "@/lib/types/game";
import { withSideToMove } from "@/lib/utils/memorizationPosition";
import { daysBetween } from "./readiness";
import { localDayOf, type RoundRecord } from "./record";
import { readReviewOpened, REVIEW_OPENED_KEY, reviewQueue, reviewsDone, stepAfter, type OpenedReview, type ReviewQueue } from "./review";
import { labStore } from "./storage";

/** Far more steps than one player's queue holds at once, so a marker is only dropped long after its board has left the queue. */
const OPENED_KEEP = 50;

export type ReviewBoard = Extract<SetBoard, { kind: "review" }>;

export type ReviewStart =
  | { readonly kind: "play"; readonly pieceCount: number; readonly memorizeTime: number; readonly board: ReviewBoard }
  | { readonly kind: "none" | "capped" };

/**
 * The record keeps only a board's placement, so the side to move is set as the game's generator sets it. An imported
 * file is checked for shape, not for a legal position, so a board the game cannot load is left out of the queue.
 */
function playableFen(placement: string): string | null {
  const fen = withSideToMove(placement);
  return fen && validateFen(fen).ok ? fen : null;
}

/** The review queue of the boards the game can load, which the home panel and /game both read. */
export function playableQueue(records: readonly RoundRecord[], today: string, opened: readonly OpenedReview[]): ReviewQueue {
  return reviewQueue(records, today, opened, (placement) => playableFen(placement) !== null);
}

export function reviewStart(records: readonly RoundRecord[], at: number, opened: readonly OpenedReview[]): ReviewStart {
  const queue = playableQueue(records, localDayOf(new Date(at)), opened);
  if (reviewsDone(queue)) return { kind: "capped" };
  const [next] = queue.due;
  const fen = next && playableFen(next.fen);
  if (!fen) return { kind: "none" };
  const { reviewOf, firstDay, step, pieceCount, memorizeSeconds } = next;
  return { kind: "play", pieceCount, memorizeTime: memorizeSeconds, board: { kind: "review", fen, reviewOf, firstDay, step } };
}

/** Reads the record on this device for the board due next. Marks nothing: only the caller that starts the round knows it is played. */
export async function openReview(at: number): Promise<ReviewStart> {
  const store = labStore();
  const records = store && (await store.isAvailable()) ? await store.listRounds() : [];
  return reviewStart(records, at, readReviewOpened());
}

export function markReviewOpened({ reviewOf, firstDay }: ReviewBoard, at: number = Date.now()): void {
  const day = localDayOf(new Date(at));
  const step = stepAfter(daysBetween(firstDay, day)) - 1;
  const kept = readReviewOpened().filter((opened) => opened.reviewOf !== reviewOf || opened.step !== step);
  try {
    window.localStorage.setItem(REVIEW_OPENED_KEY, JSON.stringify([...kept, { reviewOf, step, day }].slice(-OPENED_KEEP)));
  } catch {
    // Without storage a review left before its result can be opened again, as every round could before.
  }
}
