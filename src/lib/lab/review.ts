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

/** A review step started on this device. */
export interface OpenedReview {
  readonly reviewOf: string;
  /** The last step the board's delay had passed when it was opened, so the board comes back at the step after it. */
  readonly step: number;
  /** The local day it was opened; null for a marker kept before days were. */
  readonly day: string | null;
}

/**
 * The review steps started on this device, newest last. Kept apart from the record for the same reason as the daily
 * board's marker: a review left before its result writes no round, yet its board has been seen.
 */
export const REVIEW_OPENED_KEY = "memory-chess-lab-review-opened";

function parseOpened(value: unknown): OpenedReview | null {
  if (typeof value === "string") {
    const at = value.lastIndexOf(":");
    const step = Number(value.slice(at + 1));
    return at > 0 && Number.isInteger(step) ? { reviewOf: value.slice(0, at), step, day: null } : null;
  }
  if (typeof value !== "object" || value === null) return null;
  const { reviewOf, step, day } = value as Record<string, unknown>;
  return typeof reviewOf === "string" && Number.isInteger(step) && typeof day === "string" ? { reviewOf, step: step as number, day } : null;
}

export function readReviewOpened(): OpenedReview[] {
  try {
    const stored: unknown = JSON.parse(window.localStorage.getItem(REVIEW_OPENED_KEY) ?? "[]");
    return Array.isArray(stored) ? stored.flatMap((value) => parseOpened(value) ?? []) : [];
  } catch {
    return [];
  }
}

/** The step after the longest delay reviewed, so a late review skips the steps it passed and a second review at one step moves nothing. */
export const stepAfter = (delay: number): number => REVIEW_DAYS.filter((day) => day <= delay).length;

const missed = ({ accuracy, config }: RoundRecordV2) => accuracy < LAB_THRESHOLDS.reviewBelow && config.pieceCount >= LAB_THRESHOLDS.spanMinPieces;

/**
 * A step opened and left without a result counts like a review at the delay it was opened, as the daily board is spent
 * once opened. Boards first seen more than reviewWindowDays ago leave the queue, so a long break does not come back to a
 * pile of old boards.
 */
function itemOf(board: BoardHistory, today: string, opened: readonly OpenedReview[]): ReviewItem | null {
  if (board.first && !missed(board.first)) return null;
  const origin = originOf(board);
  if (!origin || daysBetween(origin.firstDay, today) > LAB_THRESHOLDS.reviewWindowDays) return null;
  const step = Math.max(
    stepAfter(Math.max(0, ...board.reviews.map(({ reviewDelayDays = 0 }) => reviewDelayDays))),
    ...opened.flatMap(({ reviewOf, step: passed }) => (reviewOf === origin.reviewOf ? [passed + 1] : [])),
  );
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

export function reviewQueue(records: readonly RoundRecord[], today: string, opened: readonly OpenedReview[]): ReviewQueue {
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
