import { computeCurve } from "@/lib/lab/curve";
import { PERSONA_TODAY, personaRounds, REVIEW_PERSONAS } from "@/lib/lab/personas";
import { reviewQueue } from "@/lib/lab/review";
import { summarize } from "@/lib/lab/summary";

function stateOf(name: (typeof REVIEW_PERSONAS)[number]) {
  const records = personaRounds(name);
  const { due, doneToday, queued, next } = reviewQueue(records, PERSONA_TODAY, []);
  const curve = computeCurve({ records, summary: summarize(records), today: PERSONA_TODAY });
  return { due: due.length, doneToday, queued, next, curve: curve.readiness.state, need: curve.readiness.need, points: curve.value?.points };
}

describe("the review personas", () => {
  it("cover nothing due, due today, due since earlier days, a warming curve and a measured one", () => {
    expect(Object.fromEntries(REVIEW_PERSONAS.map((name) => [name, stateOf(name)]))).toEqual({
      reviewNone: { due: 0, doneToday: 1, queued: 1, next: "2026-10-10", curve: "warming", need: { reviews: 2 }, points: [] },
      reviewDue: { due: 1, doneToday: 0, queued: 2, next: "2026-10-09", curve: "warming", need: { reviews: 3 }, points: [] },
      reviewOverdue: { due: 3, doneToday: 0, queued: 3, next: null, curve: "warming", need: { reviews: 3 }, points: [] },
      reviewWarming: { due: 0, doneToday: 0, queued: 2, next: "2026-10-11", curve: "warming", need: { reviews: 1 }, points: [] },
      reviewCurve: {
        due: 3,
        doneToday: 0,
        queued: 5,
        next: "2026-10-12",
        curve: "ready",
        need: undefined,
        points: [
          { day: 0, accuracy: 46, count: 4 },
          { day: 1, accuracy: 79, count: 4 },
          { day: 3, accuracy: 59, count: 4 },
        ],
      },
    });
  });
});
