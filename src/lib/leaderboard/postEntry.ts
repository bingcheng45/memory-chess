import { trackEvent } from "@/lib/analytics/events";
import type { DailyEntry, StoredEntry } from "@/lib/lab/entries";
import { isObject } from "@/lib/lab/guards";
import type { LeaderboardSubmission } from "@/types/leaderboard";

export type PostedEntry =
  | { readonly ok: true; readonly entry: StoredEntry | DailyEntry | null; readonly row: unknown }
  | { readonly ok: false; readonly message: string | null };

export async function postLeaderboardEntry(entry: LeaderboardSubmission): Promise<PostedEntry> {
  const response = await fetch("/api/leaderboard", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
  const body: unknown = await response.json().catch(() => null);
  const reply = isObject(body) ? body : {};
  if (!response.ok) return { ok: false, message: typeof reply.error === "string" ? reply.error : null };

  const mode = "mode" in entry && entry.mode ? { round_mode: entry.mode } : {};
  trackEvent({ name: "score_submit", params: { difficulty: entry.difficulty, piece_count: entry.piece_count, ...mode } });
  // Loaded only once a score is sent, so the result screen pays nothing for the stored entries before then. The
  // server has the score whether or not this device can keep it.
  try {
    const { rememberEntry } = await import("@/lib/lab/entries");
    return { ok: true, entry: rememberEntry(reply.data, Date.now()), row: reply.data };
  } catch {
    return { ok: true, entry: null, row: reply.data };
  }
}
