import { trackEvent } from "@/lib/analytics/events";
import type { LeaderboardSubmission } from "@/types/leaderboard";

export type PostedEntry = { readonly ok: true; readonly row: unknown } | { readonly ok: false; readonly message: string | null };

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
  void import("@/lib/lab/entries")
    .then(({ rememberEntry }) => rememberEntry(reply.data, Date.now()))
    .catch(() => undefined);
  return { ok: true, row: reply.data };
}
