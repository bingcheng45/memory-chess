import "fake-indexeddb/auto";
import { LAB_RECORD_CHANGED, recordLabRound } from "@/lib/lab/recordRound";
import { labStore } from "@/lib/lab/storage";
import { TARGET } from "./fixtures";

// jsdom has no structuredClone, which fake-indexeddb copies records with; a round is plain JSON.
globalThis.structuredClone ??= (value) => JSON.parse(JSON.stringify(value));

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
});
