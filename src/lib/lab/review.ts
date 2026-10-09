import { shiftDay } from "./engine";
import { daysBetween, LAB_THRESHOLDS } from "./readiness";
import type { RoundRecord, RoundRecordV2 } from "./record";
import { byEndedAt } from "./sessions";

/** Days after first sight that a missed board comes back, one review step each. */
export const REVIEW_DAYS = [1, 3, 7, 14] as const;

export interface ReviewItem {
  /** The round that first showed the board, which every review of it links to. */
  readonly reviewOf: string;
  readonly firstDay: string;
  /** The next review, an index into REVIEW_DAYS. */
  readonly step: number;
  readonly dueDay: string;
  readonly fen: string;
  readonly pieceCount: number;
  readonly memorizeSeconds: number;
}

export interface ReviewQueue {
  /** Due today or before, the longest waiting first. */
  readonly due: readonly ReviewItem[];
  readonly overdue: number;
  /** Boards in the queue, due or not. */
  readonly queued: number;
  /** The first day a board not yet due comes back; null when none is waiting. */
  readonly next: string | null;
}

/**
 * One board's rounds, oldest first. `first` is the round that first showed it, or null once that round has left the
 * log; a fresh round of a board seen before is a repeat and is in neither list.
 */
export interface BoardHistory {
  readonly first: RoundRecordV2 | null;
  readonly reviews: readonly RoundRecordV2[];
}

/** Only version 2 rounds carry a kind, so older rounds can be neither a first sight nor a review. */
export function boardHistories(records: readonly RoundRecord[]): BoardHistory[] {
  const boards = new Map<string, { first: RoundRecordV2 | null; reviews: RoundRecordV2[] }>();
  for (const record of byEndedAt(records)) {
    if (record.v !== 2) continue;
    const isReview = record.kind === "review";
    const board = boards.get(record.positionId);
    if (!board) boards.set(record.positionId, { first: isReview ? null : record, reviews: isReview ? [record] : [] });
    else if (isReview) board.reviews.push(record);
  }
  return [...boards.values()];
}

/** Where a board's reviews count from: its first round, or a review's own link and delay once that round is gone. */
export function originOf({ first, reviews }: BoardHistory): { readonly reviewOf: string; readonly firstDay: string } | null {
  if (first) return { reviewOf: first.id, firstDay: first.localDay };
  const { reviewOf, reviewDelayDays, localDay } = reviews[0];
  return reviewOf === undefined || reviewDelayDays === undefined ? null : { reviewOf, firstDay: shiftDay(localDay, -reviewDelayDays) };
}

export const reviewKey = (reviewOf: string, step: number) => `${reviewOf}:${step}`;

/**
 * The review steps started on this device, as reviewKey strings, newest last. Kept apart from the record for the same
 * reason as the daily board's marker: a review left before its result writes no round, yet its board has been seen.
 */
export const REVIEW_OPENED_KEY = "memory-chess-lab-review-opened";

export function readReviewOpened(): ReadonlySet<string> {
  try {
    const stored: unknown = JSON.parse(window.localStorage.getItem(REVIEW_OPENED_KEY) ?? "[]");
    return new Set(Array.isArray(stored) ? stored.filter((key): key is string => typeof key === "string") : []);
  } catch {
    return new Set();
  }
}

/** The step after the longest delay reviewed, so a late review skips the steps it passed and a second review at one step moves nothing. */
export const stepAfter = (delay: number): number => REVIEW_DAYS.filter((day) => day <= delay).length;

const missed = ({ accuracy, config }: RoundRecordV2) => accuracy < LAB_THRESHOLDS.reviewBelow && config.pieceCount >= LAB_THRESHOLDS.spanMinPieces;

/**
 * `opened` holds the review keys started on this device: a step opened and left without a result is spent, like the
 * daily board. Boards first seen more than reviewWindowDays ago leave the queue, so a long break does not come back to a
 * pile of old boards.
 */
function itemOf(board: BoardHistory, today: string, opened: ReadonlySet<string>): ReviewItem | null {
  if (board.first && !missed(board.first)) return null;
  const origin = originOf(board);
  if (!origin || daysBetween(origin.firstDay, today) > LAB_THRESHOLDS.reviewWindowDays) return null;
  let step = stepAfter(Math.max(0, ...board.reviews.map(({ reviewDelayDays = 0 }) => reviewDelayDays)));
  while (step < REVIEW_DAYS.length && opened.has(reviewKey(origin.reviewOf, step))) step += 1;
  if (step >= REVIEW_DAYS.length) return null;
  const shown = board.first ?? board.reviews[0];
  return {
    ...origin,
    step,
    dueDay: shiftDay(origin.firstDay, REVIEW_DAYS[step]),
    fen: shown.targetFen,
    pieceCount: shown.config.pieceCount,
    memorizeSeconds: shown.config.memorizeSeconds,
  };
}

const byWait = (a: ReviewItem, b: ReviewItem) => a.dueDay.localeCompare(b.dueDay) || a.firstDay.localeCompare(b.firstDay) || a.reviewOf.localeCompare(b.reviewOf);

export function reviewQueue(records: readonly RoundRecord[], today: string, opened: ReadonlySet<string>): ReviewQueue {
  const queued = boardHistories(records)
    .flatMap((board) => itemOf(board, today, opened) ?? [])
    .sort(byWait);
  const due = queued.filter(({ dueDay }) => dueDay <= today);
  return {
    due,
    overdue: due.filter(({ dueDay }) => dueDay < today).length,
    queued: queued.length,
    next: queued.find(({ dueDay }) => dueDay > today)?.dueDay ?? null,
  };
}
