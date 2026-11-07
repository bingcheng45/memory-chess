/** The site-wide count of finished games, as of the time the `total_plays` row was last written. */
export interface PlayCount {
  readonly plays: number;
  readonly asOf: string;
}

interface MetricRow {
  readonly metric_value?: unknown;
  readonly last_updated?: unknown;
}

function parseCount(raw: unknown): number {
  if (typeof raw === "number") return raw;
  // Postgres bigint columns can arrive as numeric strings.
  if (typeof raw === "string" && raw.trim() !== "") return Number(raw);
  return NaN;
}

/** A `total_plays` row as a count, or null when it holds no number. */
export function playCountOf(row: MetricRow | null | undefined): PlayCount | null {
  const plays = parseCount(row?.metric_value);
  return row && Number.isFinite(plays) && typeof row.last_updated === "string" ? { plays, asOf: row.last_updated } : null;
}

/** Reads the count in the browser from the CDN-cached endpoint; null when it cannot be read. */
export async function fetchPlayCount(): Promise<PlayCount | null> {
  try {
    const response = await fetch("/api/game-stats?metric=total_plays");
    if (!response.ok) return null;
    const body = await response.json();
    return playCountOf(body?.data);
  } catch {
    return null;
  }
}
