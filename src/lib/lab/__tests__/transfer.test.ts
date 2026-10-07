import { summarize, type LabSummary } from "@/lib/lab/summary";
import { buildExport, parseImport } from "@/lib/lab/transfer";
import { round } from "./fixtures";

const NOW = Date.UTC(2026, 9, 8);

describe("lab record export and import", () => {
  it("round-trips an export", () => {
    const rounds = [round({ id: "a" }), round({ id: "b", placedFen: "4k3/8/8/8/8/8/8/4K3" })];
    const file = JSON.stringify(buildExport(rounds, 1700000000000));

    expect(JSON.parse(file)).toMatchObject({ format: "memory-chess-lab", v: 2, exportedAt: 1700000000000 });
    expect(parseImport(file)).toEqual({ ok: true, rounds, rejected: 0, overCap: 0, summary: null });
  });

  it("carries the lifetime summary in the export", () => {
    const rounds = [round({ id: "a", endedAt: 10 }), round({ id: "b", endedAt: 20, localDay: "2026-10-08" })];
    const lifetime: LabSummary = { ...summarize(rounds), rounds: 7, evictedThrough: 5 };

    const result = parseImport(JSON.stringify(buildExport(rounds, NOW, lifetime)), NOW);

    expect(result).toMatchObject({ ok: true, rejected: 0, summary: { rounds: 7, evictedThrough: 5, days: ["2026-10-07", "2026-10-08"] } });
  });

  it("still reads a version 1 file, which has no summary", () => {
    const file = JSON.stringify({ format: "memory-chess-lab", v: 1, exportedAt: 0, rounds: [round({ id: "a" })] });

    expect(parseImport(file, NOW)).toEqual({ ok: true, rounds: [round({ id: "a" })], rejected: 0, overCap: 0, summary: null });
  });

  it.each([
    ["a negative count", { rounds: -1 }],
    ["fewer rounds than the file holds", { rounds: 1 }],
    ["a malformed day", { days: ["2026-13-01"] }],
    ["unsorted days", { days: ["2026-10-08", "2026-10-07"] }],
    ["too many days", { days: Array.from({ length: 401 }, (_, i) => new Date(Date.UTC(2020, 0, 1 + i)).toISOString().slice(0, 10)) }],
    ["a best with an unknown setting", { bests: { "server:4x10": { accuracy: 50, correct: 1, solveMs: 1, at: 1, rounds: 1 } } }],
    ["a best that is not a number", { bests: { "game:4x10": { accuracy: "100", correct: 1, solveMs: 1, at: 1, rounds: 1 } } }],
    ["a square count that is not finite", { squareShown: Array(64).fill(Infinity) }],
    ["a fractional watermark", { evictedThrough: 1.5 }],
    ["rounds but no day", { days: [] }],
    ["rounds but no best", { bests: {} }],
  ])("drops a summary with %s and still imports the rounds", (_, change) => {
    const rounds = [round({ id: "a", endedAt: 10 }), round({ id: "b", endedAt: 20 })];
    const file = JSON.stringify(buildExport(rounds, NOW, { ...summarize(rounds), ...change } as never));

    expect(parseImport(file, NOW)).toEqual({ ok: true, rounds, rejected: 0, overCap: 0, summary: "dropped" });
  });

  it("drops a summary that counts no round but lists a day, from a file with no rounds", () => {
    const file = JSON.stringify(buildExport([], NOW, { ...summarize([]), days: ["2026-10-07"] }));

    expect(parseImport(file, NOW)).toEqual({ ok: true, rounds: [], rejected: 0, overCap: 0, summary: "dropped" });
  });

  it("keeps an empty summary from a file with no rounds", () => {
    const file = JSON.stringify(buildExport([], NOW, summarize([])));

    expect(parseImport(file, NOW)).toMatchObject({ ok: true, summary: { rounds: 0, days: [], bests: {} } });
  });

  it("drops the summary when a round in the file had to be skipped", () => {
    const good = round({ id: "a", endedAt: 10 });
    const file = JSON.stringify(buildExport([good, { ...round({ id: "b" }), solveMs: -1 }] as never, NOW, summarize([good])));

    expect(parseImport(file, NOW)).toMatchObject({ ok: true, rejected: 1, summary: "dropped" });
  });

  it("recomputes derived fields instead of trusting the file", () => {
    const forged = { ...round(), accuracy: 100, correct: 99, squares: "x".repeat(64) };
    const result = parseImport(JSON.stringify(buildExport([{ ...forged, placedFen: "8/8/8/8/8/8/8/8" }], 0)));

    expect(result).toMatchObject({ ok: true, rejected: 0 });
    expect(result.ok && result.rounds[0]).toMatchObject({ accuracy: 0, correct: 0, wrong: 4 });
  });

  it.each([
    ["a bad FEN", { placedFen: "9/8/8/8/8/8/8/8" }],
    ["a FEN with a short rank", { targetFen: "7/8/8/8/8/8/8/8" }],
    ["an unknown source", { source: "server" }],
    ["a missing id", { id: "" }],
    ["a negative time", { solveMs: -1 }],
    ["too many pieces", { config: { pieceCount: 40, memorizeSeconds: 10, difficulty: null } }],
    ["a malformed day", { localDay: "07/10/2026" }],
  ])("rejects a round with %s and keeps the rest", (_, change) => {
    const file = JSON.stringify(buildExport([round({ id: "good" }), { ...round({ id: "bad" }), ...change }] as never, 0));

    expect(parseImport(file)).toMatchObject({ ok: true, rejected: 1, rounds: [{ id: "good" }] });
  });

  it.each([
    ["not JSON", "{", "not-json"],
    ["another app's file", JSON.stringify({ format: "something-else", v: 1, rounds: [] }), "not-a-lab-record"],
    ["a newer version", JSON.stringify({ format: "memory-chess-lab", v: 3, rounds: [] }), "newer-version"],
  ])("refuses %s", (_, text, reason) => {
    expect(parseImport(text)).toEqual({ ok: false, reason });
  });

  it("drops fields it does not know", () => {
    const file = JSON.stringify(buildExport([{ ...round(), note: "<script>" } as never], 0));

    const result = parseImport(file);

    expect(result.ok && Object.keys(result.rounds[0])).toEqual([
      "v", "id", "source", "endedAt", "localDay", "config", "targetFen", "placedFen", "squares",
      "shownByType", "missedByType", "memorizeMs", "solveMs", "correct", "wrong", "extra", "accuracy",
    ]);
  });
});
