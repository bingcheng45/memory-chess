/** @jest-environment node */
import { deriveLab } from "@/lib/lab/metrics";
import { personaChoices, personaRounds, PERSONA_TODAY, type PersonaName } from "@/lib/lab/personas";
import { summarize } from "@/lib/lab/summary";

/**
 * Each row was read off the persona's rounds by hand, not from the engine (today 2026-10-08):
 *
 * planBaseline, started 2026-10-02 (day 7). Medium rounds since: 10-02 67, 10-03 50, 10-04 100, 10-06 83, 10-08 100,
 * so 5 days; first 67 on day 1, latest 100 on day 7, up 33. The Hard round on 10-05 (12 pieces, 67) is not Medium.
 * Goal 12 pieces at 100 since 10-02: only that Hard round, so best 67, 67 percent of the way, not reached.
 *
 * planEdge, started 2026-10-03 (day 6). The 8 piece, 15 s rig on 10-03, 10-05 and 10-07: 3 days of 6. Edge files in
 * the last 30 rounds before the start: 23 rounds showed one, 30 of 41 missed, 73 percent; since: 6 rounds, 4 of 14, 29
 * percent (counted from each round's squares by a separate script). Goal 8 pieces at 70 since 10-03: the first rig
 * round scored 100, so reached on 10-03.
 *
 * ladderClimb, started 2026-10-06 (day 3). Game rounds since: 6 pieces at 10 s scoring 67, then 100, 100, 100 on
 * 10-07, which climbs the rung, then 6 pieces at 8 s scoring 100 twice today: 2 of 3 at the new rung, next 6 at 6 s.
 */
const HAND_DERIVED: Record<"planBaseline" | "planEdge" | "ladderClimb", { plans: unknown; goal: unknown; notebook: unknown }> = {
  planBaseline: {
    plans: { planId: "baseline", status: { kind: "active", day: 7 }, daysPlayed: 5, comparison: { kind: "change", firstDay: 1, first: 67, lastDay: 7, latest: 100, change: 33 } },
    goal: { best: { localDay: "2026-10-05", pieceCount: 12, accuracy: 67 }, percent: 67, reached: null },
    notebook: [],
  },
  planEdge: {
    plans: {
      planId: "edge",
      status: { kind: "active", day: 6 },
      daysPlayed: 3,
      daysElapsed: 6,
      before: { rounds: 23, shown: 41, missed: 30, percent: 73 },
      since: { rounds: 6, shown: 14, missed: 4, percent: 29 },
    },
    goal: { best: { localDay: "2026-10-03", pieceCount: 8, accuracy: 100 }, percent: 100, reached: { localDay: "2026-10-03", pieceCount: 8, accuracy: 100 } },
    notebook: [{ kind: "goalReached", params: { day: 31, pieceCount: 8, accuracy: 70 } }],
  },
  ladderClimb: {
    plans: { planId: "ladder", status: { kind: "active", day: 3 }, rung: { pieceCount: 6, memorizeSeconds: 8 }, run: 2, climbed: false, next: { pieceCount: 6, memorizeSeconds: 6 } },
    goal: null,
    notebook: [{ kind: "rungUp", params: { day: 10, pieceCount: 6, memorizeSeconds: 8 } }],
  },
};

function derived(name: PersonaName) {
  const records = personaRounds(name);
  const lab = deriveLab({ records, summary: summarize(records), today: PERSONA_TODAY, ...personaChoices(name) });
  const goal = lab.goal.value;
  return {
    plans: lab.plans.value,
    goal: goal && {
      best: goal.best && { localDay: goal.best.localDay, pieceCount: goal.best.pieceCount, accuracy: goal.best.accuracy },
      percent: goal.percent,
      reached: goal.reached && { localDay: goal.reached.localDay, pieceCount: goal.reached.pieceCount, accuracy: goal.reached.accuracy },
    },
    notebook: (lab.notebook.value?.entries ?? []).filter(({ kind }) => kind === "rungUp" || kind === "goalReached").map(({ kind, params }) => ({ kind, params })),
  };
}

describe("plans and goals for the plan personas", () => {
  it.each(Object.entries(HAND_DERIVED))("derive %s's progress as read by hand", (name, expected) => {
    expect(derived(name as PersonaName)).toEqual(expected);
  });

  it("write a rung climb once, on the round that made three in a row, however long the player stays on the old rung", () => {
    const records = personaRounds("ladderClimb");
    const extra = records.slice(-5, -2).map((record, index) => ({ ...record, id: `again-${index}`, endedAt: record.endedAt + 3_600_000 * (index + 1) }));
    const lab = deriveLab({ records: [...records, ...extra], summary: summarize(records), today: PERSONA_TODAY, ...personaChoices("ladderClimb") });

    expect(lab.notebook.value?.entries.filter(({ kind }) => kind === "rungUp").map(({ at }) => at)).toEqual([records.at(-3)?.endedAt]);
  });

  it("drop the plan's and the goal's entries along with the choice", () => {
    const records = personaRounds("planEdge");
    const lab = deriveLab({ records, summary: summarize(records), today: PERSONA_TODAY });

    expect(lab.notebook.value?.entries.some(({ kind }) => kind === "goalReached")).toBe(false);
    expect(lab.notebook.value?.entries.at(-1)).toMatchObject({ kind: "firstRound" });
  });
});
