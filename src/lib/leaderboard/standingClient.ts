import { parseStanding, type Standing, type StandingScope } from "./standing";

const RANK_ENDPOINT = "/api/leaderboard/rank";
const DEFAULT_WAIT_SECONDS = 60;

export type StandingCheck =
  | { readonly kind: "ranked"; readonly standing: Standing; readonly checkedAt: number }
  | { readonly kind: "missing"; readonly checkedAt: number }
  | { readonly kind: "limited"; readonly retryAfterSeconds: number }
  | { readonly kind: "offline" }
  | { readonly kind: "failed" };

function waitOf(header: string | null): number {
  const seconds = Number(header);
  return Number.isSafeInteger(seconds) && seconds > 0 ? seconds : DEFAULT_WAIT_SECONDS;
}

export async function checkStanding(id: string, scope: StandingScope, now: () => number = Date.now): Promise<StandingCheck> {
  if (!navigator.onLine) return { kind: "offline" };
  try {
    const response = await fetch(`${RANK_ENDPOINT}?id=${encodeURIComponent(id)}&scope=${scope}`, { cache: "no-store" });
    if (response.status === 404) return { kind: "missing", checkedAt: now() };
    if (response.status === 429) return { kind: "limited", retryAfterSeconds: waitOf(response.headers.get("Retry-After")) };
    if (!response.ok) return { kind: "failed" };
    const standing = parseStanding((await response.json())?.data);
    return standing ? { kind: "ranked", standing, checkedAt: now() } : { kind: "failed" };
  } catch {
    return { kind: "failed" };
  }
}
