import { DAY_MS } from "./readiness";
import type { RoundRecord } from "./record";

export const BACKUP_NUDGE = {
  firstRounds: 20,
  roundsBehind: 100,
  daysBehind: 14,
  snoozeDays: 14,
} as const;

export const BACKUP_SNOOZE_KEY = "memory-chess-lab-backup-snooze";
export const CAP_NOTICE_KEY = "memory-chess-lab-cap-seen";

export type BackupStatus =
  | { readonly kind: "quiet" }
  | { readonly kind: "never"; readonly rounds: number }
  | { readonly kind: "behind"; readonly roundsSince: number; readonly lastBackup: number };

export interface BackupInput {
  /** navigator.storage.persisted(): null until answered, or where the browser cannot say. */
  readonly persisted: boolean | null;
  readonly lastBackup: number | null;
  readonly records: readonly RoundRecord[];
  readonly lifetimeRounds: number;
  readonly snoozedUntil: number | null;
  readonly now: number;
}

const QUIET: BackupStatus = { kind: "quiet" };

export function backupStatusOf({ persisted, lastBackup, records, lifetimeRounds, snoozedUntil, now }: BackupInput): BackupStatus {
  if (persisted !== false || (snoozedUntil !== null && now < snoozedUntil)) return QUIET;
  if (lastBackup === null) return lifetimeRounds >= BACKUP_NUDGE.firstRounds ? { kind: "never", rounds: lifetimeRounds } : QUIET;
  const roundsSince = records.filter(({ endedAt }) => endedAt > lastBackup).length;
  const old = now - lastBackup > BACKUP_NUDGE.daysBehind * DAY_MS;
  return roundsSince >= BACKUP_NUDGE.roundsBehind || (old && roundsSince > 0) ? { kind: "behind", roundsSince, lastBackup } : QUIET;
}

export const snoozeUntil = (now: number) => now + BACKUP_NUDGE.snoozeDays * DAY_MS;

export function parseStoredTime(text: string | null): number | null {
  const at = Number(text);
  return text && Number.isFinite(at) && at > 0 ? at : null;
}
