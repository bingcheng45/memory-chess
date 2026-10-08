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
   * Alone this machine derives in about 9.5 ms at the median. Beside the other test files the median reaches 16 to 17 ms,
   * so the median is held to two frames and the fastest run, which contention slows least, to one.
   */
  it("derives every metric inside one 16 ms frame at best and two at the median of 7 runs", () => {
    deriveLab(input);
    const runs = Array.from({ length: 7 }, () => {
      const started = performance.now();
      deriveLab(input);
      return performance.now() - started;
    }).sort((a, b) => a - b);

    expect(runs[0]).toBeLessThan(16);
    expect(runs[3]).toBeLessThan(32);
  });
});
