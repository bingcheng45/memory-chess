import { buildRoundRecord, type RoundCapture, type RoundInput, type RoundRecordV1, type RoundRecordV2 } from "@/lib/lab/record";

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
  return buildRoundRecord({
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
    ...overrides,
  });
}
