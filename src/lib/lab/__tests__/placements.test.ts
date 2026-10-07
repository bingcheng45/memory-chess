import { logPlacement, logRemovals, MAX_PLACEMENT_MS, startPlacementLog, type PlacementLog } from "@/lib/lab/placements";
import type { SquareName } from "@/lib/game/board";
import { parseImport } from "@/lib/lab/transfer";
import { round } from "./fixtures";

describe("placement log", () => {
  it("keeps each placement in the order played, as ms since the rebuild began, a8 = 0 and the FEN letter", () => {
    const log = logPlacement(logPlacement(startPlacementLog(1000), 1250.4, "e1", "K"), 3100, "a8", "q");

    expect(log).toEqual({ startedAt: 1000, placements: [[250, 60, "K"], [2100, 0, "q"]], removals: 0 });
  });

  it("never lets a later placement carry an earlier time when the clock steps back", () => {
    const log = logPlacement(logPlacement(startPlacementLog(1000), 5000, "h1", "R"), 4000, "h8", "r");

    expect(log.placements.map(([ms]) => ms)).toEqual([4000, 4000]);
  });

  it("caps the time and the number of events, and still counts corrections past the cap", () => {
    let log = startPlacementLog(0);
    for (let index = 0; index < 100; index += 1) log = logRemovals(logPlacement(log, index * 10, "d4", "P"));
    const late = logPlacement(startPlacementLog(0), MAX_PLACEMENT_MS * 2, "d4", "P");

    expect(log.placements).toHaveLength(96);
    expect(log.placements.at(-1)).toEqual([950, 35, "P"]);
    expect(log.removals).toBe(100);
    expect(late.placements).toEqual([[3600000, 35, "P"]]);
  });

  it("counts several pieces cleared at once and ignores a clear of an empty board", () => {
    const log = startPlacementLog(0);

    expect(logRemovals(log, 3).removals).toBe(3);
    expect(logRemovals(log, 0)).toBe(log);
  });

  it("stops counting corrections at the most a file may carry", () => {
    const log = logRemovals(logRemovals(startPlacementLog(0), 9_999), 5);

    expect(log.removals).toBe(10_000);
  });

  it("skips a placement on a square off the board or with a letter that is not a piece", () => {
    const log = logPlacement(logPlacement(startPlacementLog(0), 10, "z9" as SquareName, "K"), 20, "e1", "X");

    expect(log.placements).toEqual([]);
  });

  it("never writes a log its own importer refuses", () => {
    const busy: PlacementLog = logRemovals(logPlacement(startPlacementLog(0), 10, "z9" as SquareName, "K"), 50_000);
    const { v, ...core } = round();
    const file = { format: "memory-chess-lab", v: 2, rounds: [{ ...core, v: 2, placements: busy.placements, removals: busy.removals }] };

    expect(v).toBe(1);
    expect(parseImport(JSON.stringify(file), Date.UTC(2026, 9, 8))).toMatchObject({ ok: true, rejected: 0 });
  });
});
