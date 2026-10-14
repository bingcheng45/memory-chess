import "fake-indexeddb/auto";
import { deserialize, serialize } from "node:v8";
import { recordLabRound } from "@/lib/lab/recordRound";
import { LAB_RECORD_CHANGED } from "@/lib/lab/recordSync";
import { labStore } from "@/lib/lab/storage";
import { TARGET } from "./fixtures";

// jsdom has no structuredClone, which fake-indexeddb copies records with.
globalThis.structuredClone ??= (value) => deserialize(serialize(value));

describe("recordLabRound", () => {
  it("saves a version 2 round with the start, the position id, the timezone offset and the placements", async () => {
    const changed = jest.fn();
    window.addEventListener(LAB_RECORD_CHANGED, changed);
    const endedAt = new Date(2026, 9, 8, 21, 30);

    const saved = await recordLabRound(
      {
        source: "game",
        startSource: "home_quick",
        pieceCount: 4,
        memorizeSeconds: 10,
        targetFen: `${TARGET} w - - 0 1`,
        placedFen: TARGET,
        memorizeMs: 10000,
        solveMs: 7000,
        placements: [[1200, 60, "K"], [2500, 4, "k"]],
        removals: 0,
      },
      endedAt,
    );
    const [record] = (await labStore()?.listRounds()) ?? [];

    expect(saved).toBe(true);
    expect(changed).toHaveBeenCalledTimes(1);
    expect(record).toMatchObject({
      v: 2,
      source: "game",
      startSource: "home_quick",
      kind: "normal",
      positionId: "0a6c3bd6ea5bcc",
      localDay: "2026-10-08",
      endedAt: endedAt.getTime(),
      tzOffsetMin: endedAt.getTimezoneOffset(),
      placements: [[1200, 60, "K"], [2500, 4, "k"]],
      removals: 0,
    });
  });

  it("saves the round under the id the caller chose, so the result screen can find it", async () => {
    const facts = {
      id: "round-from-the-store",
      source: "game",
      pieceCount: 4,
      memorizeSeconds: 10,
      targetFen: TARGET,
      placedFen: TARGET,
      memorizeMs: 10000,
      solveMs: 7000,
    } as const;

    await recordLabRound(facts, new Date(2026, 9, 8, 22));
    const ids = ((await labStore()?.listRounds()) ?? []).map(({ id }) => id);

    expect(ids).toContain("round-from-the-store");
  });

  it("saves a set board's facts: the day of a daily board, and a review's first round and days since it", async () => {
    const facts = { source: "game", pieceCount: 4, memorizeSeconds: 10, targetFen: TARGET, placedFen: TARGET, memorizeMs: 10000, solveMs: 7000 } as const;

    await recordLabRound({ ...facts, id: "daily-round", board: { kind: "daily", day: "2026-10-08", fen: TARGET } }, new Date(2026, 9, 8, 23));
    await recordLabRound(
      { ...facts, id: "review-round", board: { kind: "review", fen: TARGET, reviewOf: "first-round", firstDay: "2026-10-02", step: 2 } },
      new Date(2026, 9, 9, 0, 5),
    );
    const saved = ((await labStore()?.listRounds()) ?? []).filter(({ id }) => id === "daily-round" || id === "review-round");

    expect(saved).toMatchObject([
      { id: "daily-round", kind: "daily", dailyDay: "2026-10-08" },
      { id: "review-round", kind: "review", localDay: "2026-10-09", reviewOf: "first-round", reviewDelayDays: 7 },
    ]);
    const boardKeys = ["dailyDay", "reviewOf", "reviewDelayDays", "step", "firstDay"];
    expect(saved.map((record) => Object.keys(record).filter((key) => boardKeys.includes(key)).sort())).toEqual([["dailyDay"], ["reviewDelayDays", "reviewOf"]]);
  });
});
