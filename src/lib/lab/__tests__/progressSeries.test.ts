import { progressOf, rollingMean } from "../progressSeries";

const accuracy = { betterWhen: "higher", window: 5, levelBand: 2 } as const;
const pace = { betterWhen: "lower", window: 5, levelBand: 0.1 } as const;

describe("rollingMean", () => {
  it("averages each value with the ones before it, up to the window", () => {
    expect(rollingMean([60, 70, 80, 90], 3)).toEqual([60, 65, 70, 80]);
  });
});

describe("progressOf", () => {
  it("reads rising accuracy as better and keeps the rolling mean beside the values", () => {
    expect(progressOf([60, 70, 80, 90], accuracy)).toEqual({
      values: [60, 70, 80, 90],
      rolling: [60, 65, 70, 75],
      best: { index: 3, value: 90 },
      latest: 90,
      tone: "better",
    });
  });

  it("reads falling accuracy as worse and a move inside the band as level", () => {
    expect(progressOf([90, 80, 70, 60], accuracy).tone).toBe("worse");
    expect(progressOf([80, 81, 82, 81], accuracy).tone).toBe("level");
  });

  it("reads falling seconds per piece as better, rising as worse, a tenth either way as level", () => {
    expect(progressOf([4.2, 3.9, 3.5, 3.1], pace).tone).toBe("better");
    expect(progressOf([3.1, 3.5, 3.9, 4.2], pace).tone).toBe("worse");
    expect(progressOf([3.5, 3.6, 3.5, 3.55], pace).tone).toBe("level");
  });

  it("calls a single round level", () => {
    expect(progressOf([72], accuracy).tone).toBe("level");
  });

  it("names the latest of tied bests, the lowest pace when lower is better", () => {
    expect(progressOf([92, 80, 92, 85], accuracy).best).toEqual({ index: 2, value: 92 });
    expect(progressOf([3.0, 4.1, 3.0, 3.6], pace).best).toEqual({ index: 2, value: 3 });
  });

  it("compares the last window with the first, ignoring the middle", () => {
    expect(progressOf([50, 50, 50, 50, 50, 99, 0, 60, 60, 60, 60, 60], accuracy).tone).toBe("better");
    expect(progressOf([60, 60, 60, 60, 60, 0, 99, 50, 50, 50, 50, 50], accuracy).tone).toBe("worse");
  });
});
