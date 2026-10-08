import { summarize } from "@/lib/lab/summary";
import { welcomeBack } from "@/lib/lab/welcome";
import { round } from "./fixtures";

const HALF = "4k3/8/8/8/8/8/8/4K3";
const FIRST = round({ id: "a", localDay: "2026-09-20", endedAt: Date.UTC(2026, 8, 20, 12) });
const LAST = round({ id: "b", localDay: "2026-10-05", endedAt: Date.UTC(2026, 9, 5, 12), placedFen: HALF, pieceCount: 4, memorizeSeconds: 12 });

const welcome = (records = [FIRST, LAST], today = "2026-10-08", summary = summarize(records)) => welcomeBack({ records, summary, today });

describe("welcome back", () => {
  it("greets a player 3 days after their last round with their day count and their latest round", () => {
    expect(welcome()).toEqual({ day: 19, accuracy: 50, pieceCount: 4, memorizeSeconds: 12 });
  });

  it("reads the latest round by when it ended, whatever the log order", () => {
    expect(welcome([LAST, FIRST])).toEqual({ day: 19, accuracy: 50, pieceCount: 4, memorizeSeconds: 12 });
  });

  it("stays quiet for a player who played in the last 2 days, for a first visit and before the client knows today", () => {
    expect([welcome(undefined, "2026-10-07"), welcome([], "2026-10-08"), welcome(undefined, ""), welcome(undefined, "2026-10-08")?.day]).toEqual([
      null,
      null,
      null,
      19,
    ]);
  });

  it("leaves out the day count once the kept days no longer reach back to the first round", () => {
    const days = Array.from({ length: 400 }, (_, index) => new Date(Date.UTC(2025, 8, 1 + index, 12)).toISOString().slice(0, 10));
    const summary = { ...summarize([FIRST, LAST]), days: [...days.slice(0, 399), "2026-10-05"] };

    expect(welcome(undefined, "2026-10-08", summary)).toEqual({ day: null, accuracy: 50, pieceCount: 4, memorizeSeconds: 12 });
  });
});
