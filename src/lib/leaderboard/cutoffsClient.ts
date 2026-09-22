import { parseCutoffs, type LeaderboardCutoffs } from "@/lib/leaderboard/ranking";

export const CUTOFFS_STORAGE_KEY = "memory-chess:leaderboard-cutoffs:v1";
export const CUTOFFS_TTL_MS = 10 * 60 * 1000;

const CUTOFFS_ENDPOINT = "/api/leaderboard/cutoffs";

let inFlight: Promise<LeaderboardCutoffs | null> | null = null;

function readStoredEntry(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.localStorage.getItem(CUTOFFS_STORAGE_KEY);
  } catch {
    // A private window or blocked site data throws on access; the result
    // screen has to survive that, so a cache we cannot read is simply a miss.
    return null;
  }
}

function writeStoredEntry(cutoffs: LeaderboardCutoffs): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(
      CUTOFFS_STORAGE_KEY,
      JSON.stringify({ fetchedAt: Date.now(), cutoffs }),
    );
  } catch {
    // Same as the read: a cache we cannot write costs a fetch, not an error.
  }
}

function readCachedCutoffs(): LeaderboardCutoffs | null {
  const raw = readStoredEntry();
  if (raw === null) {
    return null;
  }

  let entry: { fetchedAt?: unknown; cutoffs?: unknown };
  try {
    entry = JSON.parse(raw);
  } catch {
    return null;
  }

  const fetchedAt = entry?.fetchedAt;
  if (typeof fetchedAt !== "number" || !Number.isFinite(fetchedAt)) {
    return null;
  }
  if (Date.now() - fetchedAt >= CUTOFFS_TTL_MS) {
    return null;
  }

  return parseCutoffs(entry?.cutoffs);
}

async function fetchCutoffs(): Promise<LeaderboardCutoffs | null> {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const response = await fetch(CUTOFFS_ENDPOINT);
    if (!response.ok) {
      return null;
    }
    const body: { data?: unknown } = await response.json();
    return parseCutoffs(body?.data);
  } catch {
    return null;
  }
}

async function fetchAndCache(): Promise<LeaderboardCutoffs | null> {
  const cutoffs = await fetchCutoffs();
  if (cutoffs !== null) {
    writeStoredEntry(cutoffs);
  }
  return cutoffs;
}

export async function loadLeaderboardCutoffs(): Promise<LeaderboardCutoffs | null> {
  const cached = readCachedCutoffs();
  if (cached !== null) {
    return cached;
  }

  if (inFlight === null) {
    inFlight = fetchAndCache();
  }
  const request = inFlight;

  try {
    return await request;
  } finally {
    if (inFlight === request) {
      inFlight = null;
    }
  }
}

export function warmLeaderboardCutoffs(): void {
  void loadLeaderboardCutoffs().catch(() => null);
}
