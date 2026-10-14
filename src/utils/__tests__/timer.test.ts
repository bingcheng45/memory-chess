import { formatSeconds, formatSecondsMs } from "@/utils/timer";

describe("formatSecondsMs", () => {
  it.each([
    [9873, "9.873"],
    [10000, "10.000"],
    [0, "0.000"],
    [61234, "61.234"],
    [-5, "0.000"],
  ])("reads %i ms as %s", (ms, expected) => {
    expect(formatSecondsMs(ms)).toBe(expected);
  });

  it("leaves formatSeconds at one decimal for the game timer", () => {
    expect(formatSeconds(4230)).toBe("4.2");
  });
});
