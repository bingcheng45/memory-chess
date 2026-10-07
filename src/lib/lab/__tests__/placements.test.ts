import { logPlacement, logRemovals, MAX_PLACEMENT_MS, startPlacementLog } from "@/lib/lab/placements";

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
});
