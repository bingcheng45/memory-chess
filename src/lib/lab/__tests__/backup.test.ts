import { backupStatusOf, parseStoredTime, snoozeUntil, type BackupInput } from "@/lib/lab/backup";
import { roundV2 } from "./fixtures";

const NOW = Date.UTC(2026, 9, 18, 12);
const DAY = 24 * 60 * 60 * 1000;

const roundsEndingBefore = (count: number, end: number) => Array.from({ length: count }, (_, index) => roundV2({ id: `r${index}`, endedAt: end - (index + 1) * 60_000 }));

const input = (overrides: Partial<BackupInput>): BackupInput => ({
  persisted: false,
  lastBackup: null,
  records: [],
  lifetimeRounds: 0,
  snoozedUntil: null,
  now: NOW,
  ...overrides,
});

describe("backupStatusOf", () => {
  it("asks for a first copy at 20 rounds, not at 19", () => {
    expect(backupStatusOf(input({ records: roundsEndingBefore(20, NOW), lifetimeRounds: 20 }))).toEqual({ kind: "never", rounds: 20 });
    expect(backupStatusOf(input({ records: roundsEndingBefore(19, NOW), lifetimeRounds: 19 }))).toEqual({ kind: "quiet" });
  });

  it("counts lifetime rounds for a first copy, including rounds the log no longer holds", () => {
    expect(backupStatusOf(input({ records: roundsEndingBefore(5, NOW), lifetimeRounds: 5003 }))).toEqual({ kind: "never", rounds: 5003 });
  });

  it("stays quiet while the browser keeps the record for good, or cannot say", () => {
    const heavy = { records: roundsEndingBefore(150, NOW), lifetimeRounds: 150 };
    expect(backupStatusOf(input({ ...heavy, persisted: true }))).toEqual({ kind: "quiet" });
    expect(backupStatusOf(input({ ...heavy, persisted: null }))).toEqual({ kind: "quiet" });
    expect(backupStatusOf(input({ ...heavy, persisted: false }))).toEqual({ kind: "never", rounds: 150 });
  });

  it("returns 100 rounds after the last copy, counting only the rounds since it", () => {
    const lastBackup = NOW - 2 * DAY;
    const before = roundsEndingBefore(40, lastBackup).map((record, index) => ({ ...record, id: `old${index}` }));
    expect(backupStatusOf(input({ lastBackup, records: [...before, ...roundsEndingBefore(100, NOW)], lifetimeRounds: 140 }))).toEqual({
      kind: "behind",
      roundsSince: 100,
      lastBackup,
    });
    expect(backupStatusOf(input({ lastBackup, records: [...before, ...roundsEndingBefore(99, NOW)], lifetimeRounds: 139 }))).toEqual({ kind: "quiet" });
  });

  it("returns once the copy is over 14 days old and misses a round, never for a copy that misses nothing", () => {
    const lastBackup = NOW - 15 * DAY;
    expect(backupStatusOf(input({ lastBackup, records: roundsEndingBefore(1, NOW), lifetimeRounds: 30 }))).toEqual({ kind: "behind", roundsSince: 1, lastBackup });
    expect(backupStatusOf(input({ lastBackup, records: roundsEndingBefore(3, lastBackup), lifetimeRounds: 30 }))).toEqual({ kind: "quiet" });
    expect(backupStatusOf(input({ lastBackup: NOW - 13 * DAY, records: roundsEndingBefore(1, NOW), lifetimeRounds: 30 }))).toEqual({ kind: "quiet" });
  });

  it("stays hidden for 14 days after Not now, then returns", () => {
    const heavy = { records: roundsEndingBefore(25, NOW), lifetimeRounds: 25 };
    const snoozedUntil = snoozeUntil(NOW);
    expect(snoozedUntil).toBe(Date.UTC(2026, 10, 1, 12));
    expect(backupStatusOf(input({ ...heavy, snoozedUntil, now: NOW + 13 * DAY }))).toEqual({ kind: "quiet" });
    expect(backupStatusOf(input({ ...heavy, snoozedUntil, now: NOW + 14 * DAY }))).toEqual({ kind: "never", rounds: 25 });
  });
});

describe("parseStoredTime", () => {
  it("reads a stored time and refuses anything else", () => {
    expect(parseStoredTime("1792324800000")).toBe(1792324800000);
    expect(parseStoredTime(null)).toBeNull();
    expect(parseStoredTime("soon")).toBeNull();
    expect(parseStoredTime("-5")).toBeNull();
  });
});
