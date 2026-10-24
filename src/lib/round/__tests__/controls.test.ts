import { gameSlotsOf } from "@/lib/round/controls";

describe("gameSlotsOf", () => {
  it.each([
    ["idle", { primary: { label: "start", intent: "start", enabled: true }, restart: null }],
    ["ready", { primary: { label: "hide", intent: "endStudy", enabled: false }, restart: null }],
    ["countdown", { primary: { label: "hide", intent: "endStudy", enabled: false }, restart: null }],
    ["study", { primary: { label: "hide", intent: "endStudy", enabled: true }, restart: null }],
    [
      "rebuild",
      {
        primary: { label: "submit", intent: "submit", enabled: true },
        restart: { label: "restart", intent: "start", enabled: true },
      },
    ],
    ["scored", { primary: { label: "again", intent: "start", enabled: true }, restart: null }],
  ] as const)("places %s's controls", (phase, slots) => {
    expect(gameSlotsOf(phase)).toEqual(slots);
  });
});
