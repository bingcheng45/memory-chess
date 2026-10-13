import { trackEvent } from "@/lib/analytics/events";
import type { DailyEntry, StoredEntry } from "@/lib/lab/entries";
import type { LeaderboardSubmission } from "@/types/leaderboard";

/** `entry` is the stored row as this device remembers it, or null when the reply carried no row it can read. */
export type PostedEntry =
  | { readonly ok: true; readonly entry: StoredEntry | DailyEntry | null }
  | { readonly ok: false; readonly message: string | null };

/** Every leaderboard submission goes through here, a ranked round's from the result screen and a daily board's from /daily. */
export async function postLeaderboardEntry(entry: LeaderboardSubmission): Promise<PostedEntry> {
  const response = await fetch("/api/leaderboard", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
  const body: unknown = await response.json().catch(() => null);
  const reply = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  if (!response.ok) return { ok: false, message: typeof reply.error === "string" ? reply.error : null };

  trackEvent({ name: "score_submit", params: { difficulty: entry.difficulty, piece_count: entry.piece_count } });
  // Loaded only once a score is sent, so the result screen pays nothing for the stored entries before then.
  const stored = await import("@/lib/lab/entries")
    .then(({ entryFromRow, rememberEntry }) => {
      const now = Date.now();
      rememberEntry(reply.data, now);
      return entryFromRow(reply.data, now);
    })
    .catch(() => null);
  return { ok: true, entry: stored };
}
