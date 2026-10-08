/** @jest-environment node */
import { IDBFactory } from "fake-indexeddb";
import { deriveLab } from "@/lib/lab/metrics";
import { exportPersona, memoryLabStore, PERSONA_TODAY, type PersonaName } from "@/lib/lab/personas";
import { weekProgress } from "@/lib/lab/week";

async function habitOf(name: PersonaName) {
  const { rounds, summary } = await exportPersona(name, memoryLabStore(new IDBFactory()));
  if (!summary) throw new Error(`${name} exported no summary`);
  const { streak, notebook } = deriveLab({ records: rounds, summary, today: PERSONA_TODAY });
  return {
    streak: streak.value,
    week: weekProgress(summary.days, PERSONA_TODAY, 5),
    milestones: notebook.value?.entries.filter(({ kind }) => kind === "streak").map(({ params }) => [params.day, params.days, params.forgiven]),
  };
}

const played = (count: number) => Array(count).fill("played");
const missed = (count: number) => Array(count).fill("missed");

/**
 * Derived by hand from the persona plans, with today Thursday 8 October 2026, so the week runs from Monday the 5th.
 * graceStreak plays 31 to 24 days ago without day 27, then 19 days ago to today without day 9.
 */
describe("streak and week progress on the persona fixtures", () => {
  it.each([
    [
      "graceStreak",
      {
        // Today back to day 8 is 9 days, day 9 is forgiven, days 10 to 19 are 10 more; days 20 and 21 are both missed.
        streak: { current: 19, longest: 19, graceUsed: true, forgivenDays: ["2026-09-29"], window: [...played(4), "forgiven", ...played(9)] },
        week: { daysPlayed: 4, goal: 5, weekStart: "2026-10-05", remaining: 1 },
        // Day N counts from 31 days ago. The older run reaches 3, then 7 through day 27; the current run 3, 7, then 14 through day 9.
        milestones: [[27, 14, 1], [19, 7, 0], [15, 3, 0], [8, 7, 1], [3, 3, 0]],
      },
    ],
    [
      "thirtyDays",
      {
        streak: { current: 30, longest: 30, graceUsed: false, forgivenDays: [], window: played(14) },
        week: { daysPlayed: 4, goal: 5, weekStart: "2026-10-05", remaining: 1 },
        milestones: [[30, 30, 0], [14, 14, 0], [7, 7, 0], [3, 3, 0]],
      },
    ],
    [
      "stale",
      {
        // Last played 20 days ago: yesterday and the day before are both missed, so nothing is current.
        streak: { current: 0, longest: 6, graceUsed: false, forgivenDays: [], window: [...missed(13), "today"] },
        week: { daysPlayed: 0, goal: 5, weekStart: "2026-10-05", remaining: 5 },
        milestones: [[3, 3, 0]],
      },
    ],
    [
      "threeDays",
      {
        streak: { current: 3, longest: 3, graceUsed: false, forgivenDays: [], window: [...missed(11), ...played(3)] },
        week: { daysPlayed: 3, goal: 5, weekStart: "2026-10-05", remaining: 2 },
        milestones: [[3, 3, 0]],
      },
    ],
  ] as const)("%s", async (name, expected) => {
    expect(await habitOf(name)).toEqual(expected);
  });
});
