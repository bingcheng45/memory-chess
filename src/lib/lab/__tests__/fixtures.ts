import { buildRoundRecord, type RoundInput, type RoundRecordV1 } from "@/lib/lab/record";

export const TARGET = "4k3/8/8/3q4/8/5N2/8/4K3";

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
