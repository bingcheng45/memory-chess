/** @jest-environment node */
import { deriveLab } from "@/lib/lab/metrics";
import { personaRounds } from "@/lib/lab/personas";
import { computeSpan, computeSpeed } from "@/lib/lab/progress";
import { summarize } from "@/lib/lab/summary";

jest.mock("@/lib/lab/progress", () => {
  const actual = jest.requireActual("@/lib/lab/progress");
  return { ...actual, computeSpan: jest.fn(actual.computeSpan), computeSpeed: jest.fn(actual.computeSpeed) };
});

/** The heavy persona's rounds with a summary of exactly them, so every notebook kind replays the whole log. */
const records = personaRounds("heavy").slice(-5000);
const input = { records, summary: summarize(records), today: "2026-10-08" };

describe("deriveLab on 5,000 rounds the log still holds", () => {
  beforeEach(() => jest.mocked(computeSpan).mockClear());

  it("holds every round it is given", () => {
    expect(records).toHaveLength(5000);
    expect(input.summary.rounds).toBe(5000);
  });

  it("computes span and speed once per derive and passes them to the insights and the notebook", () => {
    jest.mocked(computeSpeed).mockClear();

    deriveLab(input);

    expect(jest.mocked(computeSpan)).toHaveBeenCalledTimes(1);
    expect(jest.mocked(computeSpeed)).toHaveBeenCalledTimes(1);
  });

  /**
   * Wall time beside the other suites swings past 2x on a busy machine, so this compares CPU time, which excludes waiting
   * for a core, against a fixed pass over the same rounds measured in turn, which slows with the core it lands on.
   * Measured: about 1.1 alone, 1.2 to 1.5 beside the full suite, and 1.9 to 2.3 for a derive done twice.
   */
  it("derives every metric in under 1.8 times the CPU time of three plain passes over the rounds", () => {
    const pairs = Array.from({ length: 25 }, () => ({ pass: cpuMs(plainPasses), derive: cpuMs(() => deriveLab(input)) }));

    const fastest = (key: "pass" | "derive") => Math.min(...pairs.map((pair) => pair[key]));
    expect(fastest("derive") / fastest("pass")).toBeLessThan(1.8);
  });
});

function cpuMs(work: () => unknown): number {
  const started = process.cpuUsage();
  work();
  const { user, system } = process.cpuUsage(started);
  return (user + system) / 1000;
}

function plainPasses(): void {
  for (let pass = 0; pass < 3; pass++) {
    const byDay = new Map<string, number[]>();
    for (const round of [...records].sort((a, b) => b.endedAt - a.endedAt)) {
      let right = 0;
      for (const square of round.squares) if (square === "c") right++;
      const day = byDay.get(round.localDay) ?? [];
      day.push(right / Math.max(1, round.correct + round.wrong));
      byDay.set(round.localDay, day);
    }
    [...byDay.values()].map((day) => day.reduce((sum, value) => sum + value, 0) / day.length).sort();
  }
}
