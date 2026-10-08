import { summarize, type LabSummary } from "@/lib/lab/summary";
import { PLACEMENT_KEEP } from "@/lib/lab/storage";
import { buildExport, parseImport } from "@/lib/lab/transfer";
import { round, roundV2, TARGET } from "./fixtures";

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

  it("round-trips a version 2 round with every new fact", () => {
    const rounds = [round({ id: "old" }), roundV2({ id: "new", endedAt: Date.UTC(2026, 9, 7, 13) })];

    expect(parseImport(JSON.stringify(buildExport(rounds, NOW)), NOW)).toEqual({ ok: true, rounds, rejected: 0, overCap: 0, summary: null });
  });

  it("round-trips a round started from an insight link", () => {
    const rounds = [roundV2({ id: "a" }, { startSource: "insight", tzOffsetMin: 0 })];

    expect(parseImport(JSON.stringify(buildExport(rounds, NOW)), NOW)).toMatchObject({ ok: true, rejected: 0, rounds: [{ startSource: "insight" }] });
  });

  it("round-trips a review round and a daily round", () => {
    const rounds = [
      roundV2({ id: "a" }, { kind: "daily", startSource: "link", tzOffsetMin: 0 }),
      roundV2({ id: "b", endedAt: Date.UTC(2026, 9, 7, 13) }, { kind: "review", reviewOf: "a", reviewDelayDays: 3, tzOffsetMin: 840 }),
    ];

    expect(parseImport(JSON.stringify(buildExport(rounds, NOW)), NOW)).toMatchObject({ ok: true, rounds, rejected: 0 });
  });

  it("reads a version 1 round that carries version 2 fields as plain version 1", () => {
    const { v, ...core } = roundV2();
    const file = JSON.stringify(buildExport([{ ...core, v: 1 } as never], NOW));

    expect(v).toBe(2);
    expect(parseImport(file, NOW)).toEqual({ ok: true, rounds: [round()], rejected: 0, overCap: 0, summary: null });
  });

  it("recomputes the position id and drops unknown fields of a version 2 round", () => {
    const file = JSON.stringify(buildExport([{ ...roundV2(), positionId: "forged", note: "<script>" } as never], NOW));

    const result = parseImport(file, NOW);

    expect(result.ok && result.rounds[0]).toEqual(roundV2());
    expect(result.ok && result.rounds[0]).toMatchObject({ positionId: "0a6c3bd6ea5bcc" });
  });

  it("imports a board written with split empty runs under the id of its standard form", () => {
    const file = JSON.stringify(buildExport([{ ...roundV2(), targetFen: "4k3/44/8/3q4/8/5N2/8/4K3" }], NOW));

    expect(parseImport(file, NOW)).toMatchObject({ ok: true, rounds: [{ targetFen: TARGET, positionId: "0a6c3bd6ea5bcc" }] });
  });

  it.each([
    ["a placement that is not a triple", { placements: [[1, 2]] }],
    ["a placement off the board", { placements: [[1, 64, "K"]] }],
    ["a placement with an unknown piece", { placements: [[1, 3, "X"]] }],
    ["a placement with a negative time", { placements: [[-1, 3, "K"]] }],
    ["placement times that step back", { placements: [[500, 3, "K"], [400, 4, "Q"]] }],
    ["a placement past the time cap", { placements: [[3600001, 3, "K"]] }],
    ["97 placements", { placements: Array.from({ length: 97 }, (_, index) => [index, 3, "P"]) }],
    ["placements that are not a list", { placements: "e1K" }],
    ["placements without a removal count", { removals: undefined }],
    ["a removal count without placements", { placements: undefined }],
    ["a fractional removal count", { removals: 1.5 }],
    ["a timezone past fourteen hours", { tzOffsetMin: 841 }],
    ["a fractional timezone", { tzOffsetMin: 30.5 }],
    ["an unknown kind", { kind: "weekly" }],
    ["a review link on a normal round", { reviewOf: "a" }],
    ["a review delay on a daily round", { kind: "daily", reviewDelayDays: 2 }],
    ["a review delay that is not a whole day", { kind: "review", reviewOf: "a", reviewDelayDays: 1.5 }],
    ["an empty review link", { kind: "review", reviewOf: "" }],
    ["an unknown start", { startSource: "server" }],
    ["a null start", { startSource: null }],
    ["a null kind", { kind: null }],
    ["a review link without its delay", { kind: "review", reviewOf: "a" }],
    ["a review delay without its link", { kind: "review", reviewDelayDays: 2 }],
  ])("skips a version 2 round with %s, counts it and keeps the rest", (_, change) => {
    const file = JSON.stringify(buildExport([roundV2({ id: "good" }), { ...roundV2({ id: "bad" }), ...change }] as never, NOW));

    expect(parseImport(file, NOW)).toMatchObject({ ok: true, rejected: 1, rounds: [{ id: "good" }] });
  });

  it("skips a round of a version it does not know", () => {
    const file = JSON.stringify(buildExport([round({ id: "good" }), { ...roundV2({ id: "bad" }), v: 3 }] as never, NOW));

    expect(parseImport(file, NOW)).toMatchObject({ ok: true, rejected: 1, rounds: [{ id: "good" }] });
  });

  it("keeps placements on the newest rounds of the file only, and every other fact on all of them", () => {
    const rounds = Array.from({ length: PLACEMENT_KEEP + 2 }, (_, index) => roundV2({ id: `r${index}`, endedAt: index + 1 }));

    const result = parseImport(JSON.stringify(buildExport([...rounds].reverse(), NOW)), NOW);
    if (!result.ok) throw new Error(result.reason);
    const { placements, removals, ...core } = rounds[1];

    expect(PLACEMENT_KEEP).toBe(500);
    expect(result.rounds.filter((record) => "placements" in record).map(({ id }) => id)).toEqual(rounds.slice(2).map(({ id }) => id));
    expect(result.rounds[1]).toEqual(core);
    expect([placements?.length, removals]).toEqual([4, 1]);
    expect(result.rounds.at(-1)).toEqual(rounds.at(-1));
  });
});
