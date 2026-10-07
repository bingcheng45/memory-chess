/** @jest-environment node */
import { buildExport, MAX_IMPORT_BYTES, parseImport, readImportFile } from "@/lib/lab/transfer";
import { ROUND_CAP } from "@/lib/lab/storage";
import { round } from "./fixtures";

const NOW = Date.UTC(2026, 9, 7, 12);
const DAY_MS = 24 * 60 * 60 * 1000;

describe("lab import limits", () => {
  it("refuses a file over 5 MB without reading it", async () => {
    const file = new File(["x".repeat(MAX_IMPORT_BYTES + 1)], "lab.json");
    const text = jest.spyOn(file, "text");

    expect(MAX_IMPORT_BYTES).toBe(5 * 1024 * 1024);
    expect(await readImportFile(file, NOW)).toEqual({ ok: false, reason: "too-large" });
    expect(text).not.toHaveBeenCalled();
  });

  it("reports a file the browser cannot read instead of throwing", async () => {
    const file = new File(["{}"], "lab.json");
    jest.spyOn(file, "text").mockRejectedValue(new Error("NotReadableError"));

    expect(await readImportFile(file, NOW)).toEqual({ ok: false, reason: "unreadable" });
  });

  it("reads a valid file", async () => {
    const file = new File([JSON.stringify(buildExport([round({ id: "a" })], NOW))], "lab.json");

    expect(await readImportFile(file, NOW)).toEqual({ ok: true, rounds: [round({ id: "a" })], rejected: 0, overCap: 0, summary: null });
  });

  it(`keeps the newest ${ROUND_CAP} of 10,000 rounds, quickly, and counts the rest`, () => {
    const rounds = Array.from({ length: 10_000 }, (_, index) => round({ id: `r${index}`, endedAt: NOW - 10_000 + index }));
    const text = JSON.stringify(buildExport(rounds, NOW));
    const started = performance.now();

    const result = parseImport(text, NOW);

    expect(performance.now() - started).toBeLessThan(3000);
    expect(result).toMatchObject({ ok: true, rejected: 0, overCap: 5000 });
    expect(result.ok && [result.rounds.length, result.rounds[0].id, result.rounds.at(-1)?.id]).toEqual([5000, "r5000", "r9999"]);
  });
});

describe("lab import validation", () => {
  it.each([
    ["an endedAt past the range of Date", { endedAt: 8.64e15 + 1 }],
    ["an endedAt more than a day ahead", { endedAt: NOW + DAY_MS + 1 }],
    ["a fractional endedAt", { endedAt: NOW - 0.5 }],
    ["a day that is not on the calendar", { localDay: "2026-02-30" }],
    ["a day more than a day ahead", { localDay: "2026-10-09" }],
    ["a piece count below 2", { config: { pieceCount: 1, memorizeSeconds: 10, difficulty: null } }],
    ["a piece count the target position disagrees with", { config: { pieceCount: 6, memorizeSeconds: 10, difficulty: null } }],
    ["a negative memorize time", { memorizeMs: -5 }],
  ])("skips a round with %s and counts it", (_, change) => {
    const file = JSON.stringify(buildExport([round({ id: "good" }), { ...round({ id: "bad" }), ...change }] as never, NOW));

    expect(parseImport(file, NOW)).toMatchObject({ ok: true, rejected: 1, overCap: 0, rounds: [{ id: "good" }] });
  });

  it("accepts a round from tomorrow, for a clock a few hours ahead", () => {
    const file = JSON.stringify(buildExport([round({ id: "ahead", endedAt: NOW + DAY_MS, localDay: "2026-10-08" })], NOW));

    expect(parseImport(file, NOW)).toMatchObject({ ok: true, rejected: 0, rounds: [{ id: "ahead" }] });
  });
});
