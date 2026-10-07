import { buildExport, parseImport } from "@/lib/lab/transfer";
import { round } from "./fixtures";

describe("lab record export and import", () => {
  it("round-trips an export", () => {
    const rounds = [round({ id: "a" }), round({ id: "b", placedFen: "4k3/8/8/8/8/8/8/4K3" })];
    const file = JSON.stringify(buildExport(rounds, 1700000000000));

    expect(JSON.parse(file)).toMatchObject({ format: "memory-chess-lab", v: 1, exportedAt: 1700000000000 });
    expect(parseImport(file)).toEqual({ ok: true, rounds, rejected: 0, overCap: 0 });
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
    ["a newer version", JSON.stringify({ format: "memory-chess-lab", v: 2, rounds: [] }), "newer-version"],
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
