import { LAB_SOURCES, type LabSource, type RoundRecord } from "./record";

/** Rounds closer together than this are one sitting. Derived, never stored, so it can change without a migration. */
export const SESSION_GAP_MS = 30 * 60 * 1000;

export interface Session {
  /** When its first round ended. */
  readonly startedAt: number;
  readonly endedAt: number;
  readonly rounds: number;
  readonly sources: readonly LabSource[];
}

export const byEndedAt = <T extends Pick<RoundRecord, "endedAt">>(records: readonly T[]): T[] =>
  [...records].sort((a, b) => a.endedAt - b.endedAt);

export function sessionRuns<T extends Pick<RoundRecord, "endedAt">>(records: readonly T[]): T[][] {
  const runs: T[][] = [];
  for (const record of byEndedAt(records)) {
    const run = runs.at(-1);
    if (run && record.endedAt - run[run.length - 1].endedAt < SESSION_GAP_MS) run.push(record);
    else runs.push([record]);
  }
  return runs;
}

export function sessionsOf(records: readonly RoundRecord[]): Session[] {
  return sessionRuns(records).map((run) => ({
    startedAt: run[0].endedAt,
    endedAt: run[run.length - 1].endedAt,
    rounds: run.length,
    sources: LAB_SOURCES.filter((source) => run.some((record) => record.source === source)),
  }));
}
