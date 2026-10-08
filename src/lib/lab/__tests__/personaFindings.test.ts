/** @jest-environment node */
import { IDBFactory } from "fake-indexeddb";
import { deriveLab } from "@/lib/lab/metrics";
import { exportPersona, memoryLabStore, PERSONA_TODAY, type PersonaName } from "@/lib/lab/personas";

/**
 * Expected values were counted from the exported persona files by a separate script that shares no code with the
 * app: thirtyDays misses 103 of 151 pieces on the a and h files and 17 of 138 on d and e, and 14 of 26 queens; colourSkew misses 7 of 120 white and 36 of 120 black pieces; plateau averages
 * 88.2 percent over both of its last two sets of 10 rounds with a span of 6 now and a week before. The notebooks come from
 * the same script, which writes a best only for a point more accuracy or half a second off the last best written.
 */
async function labOf(name: PersonaName) {
  const file = await exportPersona(name, memoryLabStore(new IDBFactory()));
  if (!file.summary) throw new Error(`${name} exported no summary`);
  return deriveLab({ records: file.rounds, summary: file.summary, today: PERSONA_TODAY });
}

const findings = async (name: PersonaName) =>
  (await labOf(name)).insights.value?.insights.map(({ ruleId, params, action }) => ({ ruleId, params, action }));
const entries = async (name: PersonaName) => (await labOf(name)).notebook.value?.entries.map(({ kind, params }) => [kind, params]);

describe("persona findings", () => {
  it("finds the thirty-day player's edge files and weak queens", async () => {
    expect(await findings("thirtyDays")).toEqual([
      { ruleId: "edgeFiles", params: { times: 5.5, edge: 68, centre: 12, edgeShown: 151, centreShown: 138 }, action: { kind: "rig", pieceCount: 8, memorizeSeconds: 15 } },
      { ruleId: "weakType", params: { type: "q", recalled: 12, shown: 26, percent: 46 }, action: { kind: "guide", guide: "patterns" } },
    ]);
  });

  it("finds black pieces slipping for the colour-skewed player, then a plateau", async () => {
    expect(await findings("colourSkew")).toEqual([
      { ruleId: "colourGap", params: { weaker: "b", weakerPercent: 70, strongerPercent: 94, weakerShown: 120, strongerShown: 120 }, action: { kind: "guide", guide: "vision" } },
      { ruleId: "plateau", params: { source: "game", pieceCount: 6, memorizeSeconds: 10, last: 82, before: 80, span: 6 }, action: { kind: "rig", pieceCount: 7, memorizeSeconds: 10 } },
    ]);
  });

  it("finds a plateau at Medium and offers seven pieces", async () => {
    expect(await findings("plateau")).toEqual([
      { ruleId: "plateau", params: { source: "game", pieceCount: 6, memorizeSeconds: 10, last: 88, before: 88, span: 6 }, action: { kind: "rig", pieceCount: 7, memorizeSeconds: 10 } },
    ]);
  });

  it("finds the stale player's quicker but less accurate rounds", async () => {
    expect(await findings("stale")).toEqual([
      { ruleId: "fasterLessAccurate", params: { source: "game", pieceCount: 6, memorizeSeconds: 10, faster: 0.5, fell: 9 }, action: { kind: "rig", pieceCount: 6, memorizeSeconds: 10 } },
    ]);
  });

  it.each(["threeDays", "heavy", "easyOnly", "spanClimber", "shortSessions"] as const)("finds nothing for %s", async (name) => {
    expect(await findings(name)).toEqual([]);
  });
});

describe("persona notebooks", () => {
  it("writes the three-day player's notebook", async () => {
    expect(await entries("threeDays")).toEqual([
      ["rounds", { day: 3, count: 10 }],
      ["streak", { day: 3, days: 3 }],
      ["span", { day: 1, from: 0, to: 6 }],
      ["firstRound", { day: 1, pieceCount: 6, accuracy: 100 }],
    ]);
  });

  it("writes the plateau player's notebook", async () => {
    expect(await entries("plateau")).toEqual([
      ["streak", { day: 14, days: 14 }],
      ["rounds", { day: 13, count: 50 }],
      ["streak", { day: 7, days: 7 }],
      ["best", { day: 3, source: "game", pieceCount: 6, memorizeSeconds: 10, accuracy: 100, previous: 100, by: "time", solveSeconds: 10.6 }],
      ["rounds", { day: 3, count: 10 }],
      ["streak", { day: 3, days: 3 }],
      ["span", { day: 1, from: 0, to: 6 }],
      ["best", { day: 1, source: "game", pieceCount: 6, memorizeSeconds: 10, accuracy: 100, previous: 100, by: "time", solveSeconds: 18.2 }],
      ["firstRound", { day: 1, pieceCount: 6, accuracy: 100 }],
    ]);
  });

  it("writes only round counts and streaks for the heavy player, whose oldest rounds were evicted", async () => {
    expect((await entries("heavy"))?.map(([kind]) => kind)).toEqual(["streak", "rounds", "streak", "rounds", "streak", "streak", "rounds", "rounds", "streak", "rounds"]);
  });
});
