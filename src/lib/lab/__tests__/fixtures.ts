import { buildRoundRecord, type RoundCapture, type RoundInput, type RoundRecord, type RoundRecordV1, type RoundRecordV2 } from "@/lib/lab/record";

export const TARGET = "4k3/8/8/3q4/8/5N2/8/4K3";

const INPUT: RoundInput = {
  id: "r1",
  source: "game",
  endedAt: Date.UTC(2026, 9, 7, 12),
  localDay: "2026-10-07",
  pieceCount: 4,
  memorizeSeconds: 10,
  targetFen: TARGET,
  placedFen: TARGET,
  memorizeMs: 10000,
  solveMs: 20000,
};

export const CAPTURE: RoundCapture = {
  startSource: "home_quick",
  tzOffsetMin: -480,
  placements: [[1200, 60, "K"], [2500, 4, "k"], [4100, 27, "q"], [6000, 45, "N"]],
  removals: 1,
};

export function roundV2(overrides: Partial<RoundInput> = {}, capture: RoundCapture = CAPTURE): RoundRecordV2 {
  return buildRoundRecord({ ...INPUT, ...overrides }, capture);
}

export function round(overrides: Partial<RoundInput> = {}): RoundRecordV1 {
  return buildRoundRecord({ ...INPUT, ...overrides });
}

/** A fresh round of `fen` ended at noon UTC on `day`, scored by how much of it `placedFen` puts back. */
export function seenBoard(id: string, day: string, fen: string, placedFen: string, pieceCount = 4): RoundRecordV2 {
  return roundV2({ id, endedAt: Date.parse(`${day}T12:00:00Z`), localDay: day, targetFen: fen, placedFen, pieceCount });
}

/** A review of `of`'s board on `day`, `delayDays` after it was first seen, placing `placedFen`. */
export function reviewedBoard(id: string, day: string, of: RoundRecord, delayDays: number, placedFen = of.targetFen): RoundRecordV2 {
  return roundV2(
    { id, endedAt: Date.parse(`${day}T12:00:00Z`), localDay: day, targetFen: of.targetFen, placedFen, pieceCount: of.config.pieceCount },
    { kind: "review", startSource: "review", reviewOf: of.id, reviewDelayDays: delayDays },
  );
}
