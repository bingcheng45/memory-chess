import { monotonePath, niceTicks } from "../chartGeometry";

describe("monotonePath", () => {
  it("draws a single point as a bare move", () => {
    expect(monotonePath([[5, 7]])).toBe("M5,7");
  });

  it("draws two points as a straight cubic", () => {
    expect(
      monotonePath([
        [0, 100],
        [90, 10],
      ]),
    ).toBe("M0,100 C30,70 60,40 90,10");
  });

  it("flattens at a turn so the curve never overshoots the low point", () => {
    expect(
      monotonePath([
        [0, 100],
        [50, 0],
        [100, 50],
      ]),
    ).toBe("M0,100 C16.67,66.67 33.33,0 50,0 C66.67,0 83.33,33.33 100,50");
  });

  it("shortens a steep tangent so a rising run never dips below its start", () => {
    expect(
      monotonePath([
        [0, 0],
        [10, 10],
        [20, 100],
      ]),
    ).toBe("M0,0 C3.33,1.96 6.67,0.19 10,10 C13.33,19.81 16.67,70 20,100");
  });
});

describe("niceTicks", () => {
  it("steps a rating range by a round 20 and pads the domain to the outer ticks", () => {
    expect(niceTicks(1003, 1042, 4)).toEqual({ ticks: [1000, 1020, 1040, 1060], domain: [1000, 1060] });
  });

  it("steps seconds per piece by whole seconds", () => {
    expect(niceTicks(2.1, 4.5, 4)).toEqual({ ticks: [2, 3, 4, 5], domain: [2, 5] });
  });

  it("opens a flat range around its value", () => {
    expect(niceTicks(1000, 1000, 4)).toEqual({ ticks: [990, 1000, 1010], domain: [990, 1010] });
  });
});
