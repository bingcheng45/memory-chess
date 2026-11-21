import { seededSummary } from "@/lib/lab/seed";
import { labStore } from "@/lib/lab/storage";
import { streakOf } from "@/lib/lab/streak";

const NOW = new Date(2026, 10, 22, 9);
const ENDS_TODAY_DAYS = ["2026-11-17", "2026-11-18", "2026-11-20", "2026-11-21"];

describe("seededSummary", () => {
  it("streak-ends-today: four days played ending yesterday, which skipping today would cut to two", () => {
    const days = seededSummary(new URL("http://localhost:3000/dashboard?lab-seed=streak-ends-today"), NOW)?.days ?? [];
    expect(days).toEqual(ENDS_TODAY_DAYS);
    expect(streakOf(days, "2026-11-22").current).toBe(4);
    expect(streakOf(days, "2026-11-23").current).toBe(2);
  });

  it.each([
    "https://thememorychess.com/?lab-seed=streak-ends-today",
    "https://www.thememorychess.com/dashboard?lab-seed=streak-ends-today",
    "http://localhost:3000/?lab-seed=constructor",
    "http://localhost:3000/?lab-seed=",
    "http://localhost:3000/",
  ])("seeds nothing at %s", (address) => {
    expect(seededSummary(new URL(address), NOW)).toBeNull();
  });
});

describe("labStore with a seed address", () => {
  afterEach(() => {
    jest.useRealTimers();
    window.history.replaceState(null, "", "/");
    window.localStorage.clear();
  });

  it("replaces this browser's summary before the page reads it", async () => {
    jest.useFakeTimers({ now: NOW });
    window.localStorage.setItem("memory-chess-lab-summary", "{}");
    window.history.replaceState(null, "", "/?lab-seed=streak-ends-today");

    const summary = await labStore()?.readSummary();

    expect(summary?.days).toEqual(ENDS_TODAY_DAYS);
    expect(summary?.rounds).toBe(4);
  });
});
