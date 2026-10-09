import { deriveLab } from "@/lib/lab/metrics";
import { EMPTY_SUMMARY, summarize } from "@/lib/lab/summary";
import { unlocksFor } from "@/lib/lab/unlocks";
import { personaRounds, type PersonaName } from "@/lib/lab/personas";
import { round } from "./fixtures";

const TODAY = "2026-10-08";

function unlocksOf(name: PersonaName) {
  const records = personaRounds(name, TODAY);
  return unlocksFor(deriveLab({ records, summary: records.length ? summarize(records) : EMPTY_SUMMARY, today: TODAY }));
}

describe("unlocksFor", () => {
  it("lists an easy-only player's span as needing one round with more than the two kings", () => {
    expect(unlocksOf("easyOnly")[0]).toEqual({ metric: "span", started: true, need: { largerRounds: 1 } });
  });

  it("lists every threshold before the first round, on the server too", () => {
    expect(unlocksFor(deriveLab({ records: [], summary: EMPTY_SUMMARY, today: "" }))).toEqual([
      { metric: "span", started: false, need: { qualifyingRounds: 2 } },
      { metric: "piecesHeld", started: false, need: { rounds: 5, days: 2 } },
      { metric: "trend", started: false, need: { rounds: 5, days: 2 } },
      { metric: "speed", started: false, need: { rounds: 5 } },
      { metric: "streak", started: false, need: { days: 2 } },
      { metric: "curve", started: false, need: { reviews: 3 } },
      { metric: "notebook", started: false, need: { rounds: 1 } },
      { metric: "missMap", started: false, need: { exposures: 10 } },
      { metric: "typeRecall", started: false, need: { exposures: 20 } },
      { metric: "insights", started: false, need: { rounds: 10 } },
    ]);
  });

  it("says what is still missing after one round", () => {
    const records = [round()];

    expect(unlocksFor(deriveLab({ records, summary: summarize(records), today: "2026-10-07" }))).toEqual([
      { metric: "span", started: true, need: { qualifyingRounds: 1 } },
      { metric: "piecesHeld", started: true, need: { rounds: 4, days: 1 } },
      { metric: "trend", started: true, need: { rounds: 4, days: 1 } },
      { metric: "speed", started: true, need: { rounds: 4 } },
      { metric: "streak", started: true, need: { days: 1 } },
      { metric: "curve", started: true, need: { reviews: 3 } },
      { metric: "missMap", started: true, need: { exposures: 10 } },
      { metric: "typeRecall", started: true, need: { exposures: 19 } },
      { metric: "insights", started: true, need: { rounds: 9 } },
    ]);
  });

  it.each([
    ["newVisitor", ["span", "piecesHeld", "trend", "speed", "streak", "curve", "notebook", "missMap", "typeRecall", "insights"]],
    ["twoRounds", ["span", "piecesHeld", "trend", "speed", "streak", "curve", "missMap", "typeRecall", "insights"]],
    ["easyOnly", ["span", "curve", "missMap", "typeRecall"]],
    ["thirtyDays", ["curve"]],
    ["stale", ["curve", "missMap"]],
  ] as const)("leaves out what %s can already read", (name, metrics) => {
    expect(unlocksOf(name).map(({ metric }) => metric)).toEqual(metrics);
  });
});
