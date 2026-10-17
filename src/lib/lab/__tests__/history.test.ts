import { filterHistory, historyFacets, historyOf, NO_FILTER } from "@/lib/lab/history";
import { round, roundV2 } from "./fixtures";

const at = (hour: number) => Date.UTC(2026, 9, 7, hour);

const records = [
  roundV2({ id: "game", endedAt: at(9) }, { startSource: "game_form" }),
  roundV2({ id: "daily", endedAt: at(10), pieceCount: 6 }, { kind: "daily", startSource: "daily", dailyDay: "2026-10-07" }),
  roundV2({ id: "plan", endedAt: at(11) }, { startSource: "plan" }),
  roundV2({ id: "review", endedAt: at(12) }, { kind: "review", startSource: "review", reviewOf: "game", reviewDelayDays: 1 }),
  roundV2({ id: "practice", endedAt: at(13), source: "calibration", pieceCount: 6, memorizeSeconds: 20 }, {}),
  round({ id: "legacy", endedAt: at(8) }),
];

describe("historyOf", () => {
  it("lists every round of the record newest first, naming where each came from", () => {
    expect(historyOf(records, []).map(({ record, source, setting }) => [record.id, source, setting])).toEqual([
      ["practice", "practice", "6x20"],
      ["review", "review", "4x10"],
      ["plan", "plan", "4x10"],
      ["daily", "daily", "6x10"],
      ["game", "game", "4x10"],
      ["legacy", "game", "4x10"],
    ]);
  });

  it("joins a rating change from the game store on the round id, and only there", () => {
    const rated = [
      { id: "game", timestamp: 0, skillRatingChange: 14 },
      { id: "plan", timestamp: 0, skillRatingChange: -3 },
      { id: "gone", timestamp: 0, skillRatingChange: 9 },
      { id: "daily", timestamp: 0 },
    ];

    expect(historyOf(records, rated).map(({ record, ratingChange }) => [record.id, ratingChange])).toEqual([
      ["practice", null],
      ["review", null],
      ["plan", -3],
      ["daily", null],
      ["game", 14],
      ["legacy", null],
    ]);
  });
});

describe("filters", () => {
  const rounds = historyOf(records, []);

  it("offers only the sources and settings the record holds, settings from the fewest pieces", () => {
    expect(historyFacets(rounds)).toEqual({
      sources: ["game", "daily", "plan", "review", "practice"],
      settings: [
        { key: "4x10", pieceCount: 4, memorizeSeconds: 10 },
        { key: "6x10", pieceCount: 6, memorizeSeconds: 10 },
        { key: "6x20", pieceCount: 6, memorizeSeconds: 20 },
      ],
    });
    expect(historyFacets(historyOf([records[0]], [])).sources).toEqual(["game"]);
  });

  it("keeps the rounds that match both the source and the setting", () => {
    const ids = (filter: Parameters<typeof filterHistory>[1]) => filterHistory(rounds, filter).map(({ record }) => record.id);

    expect(ids(NO_FILTER)).toHaveLength(6);
    expect(ids({ source: "game", setting: "all" })).toEqual(["game", "legacy"]);
    expect(ids({ source: "all", setting: "6x10" })).toEqual(["daily"]);
    expect(ids({ source: "practice", setting: "4x10" })).toEqual([]);
  });
});
