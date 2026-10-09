import { INSTALL_NUDGE_KEY, parseNudgeSeen, showsInstallNudge } from "@/lib/lab/installNudge";

const returning = { days: 2, installed: false, seenAt: null, seenHere: false, dismissed: false };

describe("showsInstallNudge", () => {
  it("shows to a player who came back on a second day and has not seen it", () => {
    expect(showsInstallNudge(returning)).toBe(true);
  });

  it("stays hidden after one day of play, in an installed app, or once dismissed", () => {
    expect(showsInstallNudge({ ...returning, days: 1 })).toBe(false);
    expect(showsInstallNudge({ ...returning, installed: true })).toBe(false);
    expect(showsInstallNudge({ ...returning, installed: null })).toBe(false);
    expect(showsInstallNudge({ ...returning, dismissed: true })).toBe(false);
  });

  it("stays on screen for the visit that first showed it, and never comes back", () => {
    expect(showsInstallNudge({ ...returning, seenAt: 1_760_000_000_000, seenHere: true })).toBe(true);
    expect(showsInstallNudge({ ...returning, seenAt: 1_760_000_000_000, seenHere: false })).toBe(false);
  });
});

describe("parseNudgeSeen", () => {
  it("reads the stored time and nothing else", () => {
    expect(INSTALL_NUDGE_KEY).toBe("memory-chess-lab-install-nudge");
    expect(parseNudgeSeen("1760000000000")).toBe(1_760_000_000_000);
    expect(parseNudgeSeen(null)).toBeNull();
    expect(parseNudgeSeen("soon")).toBeNull();
    expect(parseNudgeSeen("")).toBeNull();
  });
});
