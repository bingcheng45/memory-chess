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
  it("lists every threshold before the first round, on the server too", () => {
    expect(unlocksFor(deriveLab({ records: [], summary: EMPTY_SUMMARY, today: "" }))).toEqual([
      { metric: "trend", started: false, need: { rounds: 5, days: 2 } },
      { metric: "streak", started: false, need: { days: 2 } },
      { metric: "typeRecall", started: false, need: { exposures: 20 } },
      { metric: "missMap", started: false, need: { exposures: 10 } },
    ]);
  });

  it("says what is still missing after one round", () => {
    const records = [round()];

    expect(unlocksFor(deriveLab({ records, summary: summarize(records), today: "2026-10-07" }))).toEqual([
      { metric: "trend", started: true, need: { rounds: 4, days: 1 } },
      { metric: "streak", started: true, need: { days: 1 } },
      { metric: "typeRecall", started: true, need: { exposures: 19 } },
      { metric: "missMap", started: true, need: { exposures: 10 } },
    ]);
  });

  it.each([
    ["newVisitor", ["trend", "streak", "typeRecall", "missMap"]],
    ["twoRounds", ["trend", "streak", "typeRecall", "missMap"]],
    ["easyOnly", ["typeRecall", "missMap"]],
    ["thirtyDays", []],
    ["stale", ["missMap"]],
  ] as const)("leaves out what %s can already read", (name, metrics) => {
    expect(unlocksOf(name).map(({ metric }) => metric)).toEqual(metrics);
  });
});
