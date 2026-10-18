import { dashboardOf, shareCardOf, unlocksOf, type DashboardTile, type DashboardTileId, type GameStanding } from "@/lib/lab/dashboard";
import { dayDate } from "@/lib/lab/engine";
import { deriveLab } from "@/lib/lab/metrics";
import type { RoundInput, RoundRecord } from "@/lib/lab/record";
import { personaChoices, personaEntries, personaRounds, PERSONA_TODAY, type PersonaName } from "@/lib/lab/personas";
import { EMPTY_SUMMARY, summarize } from "@/lib/lab/summary";
import { roundV2 } from "./fixtures";

const QUICK = "/game?pieceCount=6&memorizeTime=10&source=dashboard";

const BEST_ACCURACY = 100;
const BEST_AT = { source: "game", pieceCount: 14, memorizeSeconds: 10 };
const RECENT_ACCURACY = 94;
const NO_GAME = { game: null, winAccuracy: 70 } as const;

function tilesFor(name: PersonaName, { today = PERSONA_TODAY, chooseHref = "/#record" as string | null, game = null as GameStanding | null } = {}) {
  const records = personaRounds(name, PERSONA_TODAY);
  const summary = records.length ? summarize(records) : EMPTY_SUMMARY;
  const choices = personaChoices(name);
  const results = deriveLab({ records, summary, today, ...choices });
  return dashboardOf({ results, summary, records, weekGoal: 5, entries: personaEntries(name), today, utcDay: PERSONA_TODAY, dailyOpened: null, chooseHref, game, winAccuracy: 70 });
}

function tilesOfRecords(records: readonly RoundRecord[]) {
  const summary = summarize(records);
  const results = deriveLab({ records, summary, today: "2026-10-07" });
  return dashboardOf({ results, summary, records, weekGoal: 5, entries: null, today: "2026-10-07", utcDay: "2026-10-07", dailyOpened: null, chooseHref: null, ...NO_GAME });
}

const tile = (tiles: readonly DashboardTile[], id: DashboardTileId) => tiles.find((candidate) => candidate.id === id);

describe("dashboardOf", () => {
  it("draws the headline figures and totals of a ready player, each with what stands behind it", () => {
    const tiles = tilesFor("spanClimber");

    expect(["span", "piecesHeld", "speed", "streak", "rounds", "days"].map((id) => tile(tiles, id as DashboardTileId))).toEqual([
      { id: "span", state: "ready", figure: { value: 14, unit: "pieces", digits: 0 }, context: { kind: "span", values: { rounds: 19, accuracy: 80, memorizeSeconds: 10 } } },
      { id: "piecesHeld", state: "ready", figure: { value: 12.1, unit: "pieces", digits: 1 }, context: { kind: "recent", values: { rounds: 30 } } },
      {
        id: "speed",
        state: "ready",
        figure: { value: 1.6, unit: "secondsPerPiece", digits: 1 },
        context: { kind: "setting", values: { source: "game", pieceCount: 14, memorizeSeconds: 10, rounds: 21 } },
      },
      { id: "streak", state: "ready", figure: { value: 45, unit: "days", digits: 0 }, context: { kind: "longest", values: { days: 45 } } },
      { id: "rounds", state: "ready", figure: { value: 135, unit: "rounds", digits: 0 }, context: { kind: "overDays", values: { days: 45 } } },
      { id: "days", state: "ready", figure: { value: 45, unit: "days", digits: 0 }, context: { kind: "firstDay", values: { date: dayDate("2026-08-25") } } },
    ]);
  });

  it("gives a warming player what each figure still needs and a round that earns it", () => {
    const tiles = tilesFor("twoRounds");

    expect(["span", "piecesHeld", "speed", "streak"].map((id) => tile(tiles, id as DashboardTileId))).toEqual([
      { id: "span", state: "warming", need: { qualifyingRounds: 1 }, rig: null, href: QUICK },
      { id: "piecesHeld", state: "warming", need: { rounds: 3, days: 1 }, rig: null, href: QUICK },
      { id: "speed", state: "warming", need: { rounds: 4 }, rig: { pieceCount: 6, memorizeSeconds: 10 }, href: QUICK },
      { id: "streak", state: "warming", need: { days: 1 }, rig: null, href: null },
    ]);
  });

  it("links a goal that has no round yet to a round at the goal's piece count", () => {
    const records = personaRounds("threeDays", PERSONA_TODAY);
    const summary = summarize(records);
    const target = { pieceCount: 9, accuracy: 90, createdDay: PERSONA_TODAY };
    const results = deriveLab({ records, summary, today: PERSONA_TODAY, plan: null, target });
    const tiles = dashboardOf({ results, summary, records, weekGoal: 5, entries: null, today: PERSONA_TODAY, utcDay: PERSONA_TODAY, dailyOpened: null, chooseHref: null, ...NO_GAME });

    expect(tile(tiles, "goal")).toEqual({
      id: "goal",
      state: "warming",
      need: { rounds: 1 },
      rig: { pieceCount: 9, memorizeSeconds: 10 },
      href: "/game?pieceCount=9&memorizeTime=10&source=dashboard",
    });
  });

  it("invites a first round everywhere for a visitor, and a choice for the plan and goal where the record offers one", () => {
    const tiles = tilesFor("newVisitor", { today: "" });

    expect(tiles.map(({ id, state, ...rest }) => [id, state, "href" in rest ? rest.href : null])).toEqual([
      ["streak", "empty", QUICK],
      ["daily", "empty", "/game?pieceCount=7&memorizeTime=9&source=daily"],
      ["rating", "empty", QUICK],
      ["span", "empty", QUICK],
      ["piecesHeld", "empty", QUICK],
      ["speed", "empty", QUICK],
      ["studyTime", "empty", QUICK],
      ["rebuildTime", "empty", QUICK],
      ["bestAccuracy", "empty", QUICK],
      ["recentAccuracy", "empty", QUICK],
      ["winStreak", "empty", QUICK],
      ["rounds", "empty", QUICK],
      ["days", "empty", QUICK],
      ["week", "empty", QUICK],
      ["curve", "empty", QUICK],
      ["notebook", "empty", QUICK],
      ["plans", "empty", "/#record"],
      ["goal", "empty", "/#record"],
      ["board", "empty", QUICK],
    ]);
    expect(tile(tilesFor("newVisitor", { today: "", chooseHref: null }), "plans")).toEqual({ id: "plans", state: "empty", href: QUICK, cta: "play" });
  });

  it("reads a chosen plan, a goal and a leaderboard entry", () => {
    expect(tile(tilesFor("planBaseline"), "plans")).toEqual({
      id: "plans",
      state: "ready",
      figure: { value: 7, unit: "days", digits: 0 },
      context: { kind: "plan", values: { planId: "baseline", status: "active" } },
    });
    expect(tile(tilesFor("planBaseline"), "goal")).toEqual({
      id: "goal",
      state: "ready",
      figure: { value: 67, unit: "percent", digits: 0 },
      context: { kind: "goal", values: { pieceCount: 12, accuracy: 100 } },
    });
    expect(tile(tilesFor("thirtyDays"), "board")).toEqual({
      id: "board",
      state: "ready",
      figure: { value: 9, unit: "pieces", digits: 0 },
      context: { kind: "entry", values: { difficulty: "hard" } },
    });
  });

  it("reads the best and recent accuracy from the record, every round counted", () => {
    const tiles = tilesFor("spanClimber");

    expect(tile(tiles, "bestAccuracy")).toEqual({
      id: "bestAccuracy",
      state: "ready",
      figure: { value: BEST_ACCURACY, unit: "percent", digits: 0 },
      context: { kind: "bestAt", values: BEST_AT },
    });
    expect(tile(tiles, "recentAccuracy")).toEqual({
      id: "recentAccuracy",
      state: "ready",
      figure: { value: RECENT_ACCURACY, unit: "percent", digits: 0 },
      context: { kind: "recent", values: { rounds: 30 } },
    });
  });

  it("averages the study time used and the rebuild time per piece over the newest 30 fresh rounds, at any setting, with the last 10 against the 10 before", () => {
    const at = (index: number): Partial<RoundInput> => ({ id: `r${index}`, endedAt: Date.UTC(2026, 9, 7, 12, index) });
    const records = [
      roundV2({ ...at(0), memorizeMs: 9000, solveMs: 90_000 }),
      ...Array.from({ length: 29 }, (_, index) => roundV2({ ...at(index + 1), pieceCount: index % 2 ? 4 : 2, memorizeMs: 5000, solveMs: 12_000 })),
      roundV2({ ...at(30), memorizeMs: 15_000, solveMs: 700_000 }),
      roundV2({ ...at(31), memorizeMs: 1000, solveMs: 1000 }, { kind: "review", startSource: "review" }),
    ];
    const tiles = tilesOfRecords(records);

    expect([tile(tiles, "studyTime"), tile(tiles, "rebuildTime")]).toEqual([
      {
        id: "studyTime",
        state: "ready",
        figure: { value: 1.9, unit: "secondsPerPiece", digits: 1 },
        context: { kind: "recent", values: { rounds: 30 } },
        trend: { direction: "up", amount: 0.1 },
      },
      {
        id: "rebuildTime",
        state: "ready",
        figure: { value: 9.4, unit: "secondsPerPiece", digits: 1 },
        context: { kind: "recent", values: { rounds: 30 } },
        trend: { direction: "up", amount: 14.7 },
      },
    ]);
  });

  it("reads the times from the only round that measured them, and invites a round when none did", () => {
    const timed = [roundV2({ id: "a", memorizeMs: 0, solveMs: 0 }), roundV2({ id: "b", endedAt: Date.UTC(2026, 9, 7, 13), memorizeMs: 6400, solveMs: 0 })];
    const tiles = tilesOfRecords(timed);

    expect([tile(tiles, "studyTime"), tile(tiles, "rebuildTime")]).toEqual([
      { id: "studyTime", state: "ready", figure: { value: 1.6, unit: "secondsPerPiece", digits: 1 }, context: { kind: "recent", values: { rounds: 1 } } },
      { id: "rebuildTime", state: "empty", href: QUICK, cta: "play" },
    ]);
  });

  it("reads a faster last 10 rounds as the time per piece trending down", () => {
    const at = (index: number, solveMs: number) => roundV2({ id: `r${index}`, endedAt: Date.UTC(2026, 9, 7, 12, index), memorizeMs: 8000, solveMs });
    const tiles = tilesOfRecords([...Array.from({ length: 10 }, (_, index) => at(index, 12_000)), ...Array.from({ length: 10 }, (_, index) => at(index + 10, 8000))]);

    expect(tile(tiles, "rebuildTime")).toMatchObject({ figure: { value: 2.5, unit: "secondsPerPiece", digits: 1 }, trend: { direction: "down", amount: 1 } });
    expect(tile(tiles, "studyTime")).toMatchObject({ figure: { value: 2, unit: "secondsPerPiece", digits: 1 }, trend: { direction: "level", amount: 0 } });
  });

  it("reads the rating with its change over the last 30 rated rounds, and the win streak, from the game store", () => {
    const changes = [...Array.from({ length: 30 }, () => 3), 40];
    const tiles = tilesFor("threeDays", { game: { rating: 1240, winStreak: 4, changes } });

    expect(tile(tiles, "rating")).toEqual({
      id: "rating",
      state: "ready",
      figure: { value: 1240, unit: "rating", digits: 0 },
      context: { kind: "rating", values: { sign: "up", change: 90, rounds: 30 } },
      trend: { direction: "up", amount: 90 },
    });
    expect(tile(tiles, "winStreak")).toEqual({
      id: "winStreak",
      state: "ready",
      figure: { value: 4, unit: "rounds", digits: 0 },
      context: { kind: "winStreak", values: { accuracy: 70 } },
    });
    expect(tile(tilesFor("threeDays", { game: { rating: 980, winStreak: 0, changes: [-20] } }), "rating")).toMatchObject({
      context: { kind: "rating", values: { sign: "down", change: 20, rounds: 1 } },
      trend: { direction: "down", amount: 20 },
    });
  });

  it("reads a rating that is level over the window as a level trend, and one with no rated round as no trend", () => {
    expect(tile(tilesFor("threeDays", { game: { rating: 1000, winStreak: 0, changes: [15, -15] } }), "rating")).toMatchObject({
      context: { kind: "rating", values: { sign: "level", change: 0, rounds: 2 } },
      trend: { direction: "level", amount: 0 },
    });
    expect(tile(tilesFor("threeDays", { game: { rating: 1000, winStreak: 0, changes: [] } }), "rating")).not.toHaveProperty("trend");
  });

  it("invites a game round for the rating and win streak before the store holds one", () => {
    const tiles = tilesFor("threeDays");

    expect(tile(tiles, "rating")).toEqual({ id: "rating", state: "empty", href: QUICK, cta: "play" });
    expect(tile(tiles, "winStreak")).toEqual({ id: "winStreak", state: "empty", href: QUICK, cta: "play" });
  });

  it("keeps a stale figure and marks it stale", () => {
    expect(tile(tilesFor("stale"), "span")).toEqual({
      id: "span",
      state: "stale",
      figure: { value: 6, unit: "pieces", digits: 0 },
      context: { kind: "span", values: { rounds: 26, accuracy: 80, memorizeSeconds: 10 } },
    });
  });
});

describe("shareCardOf", () => {
  const ids = (card: ReturnType<typeof shareCardOf>) => card?.figures.map(({ id, figure }) => `${id} ${figure.value}`);

  it("carries every ready figure of the lead row and the totals, each with what stands behind it, and the rounds played", () => {
    const card = shareCardOf(tilesFor("threeDays", { game: { rating: 1102, winStreak: 2, changes: [30] } }), 12);

    expect(ids(card)).toEqual([
      "span 6",
      "rating 1102",
      "piecesHeld 5.3",
      "speed 4.6",
      "bestAccuracy 100",
      "recentAccuracy 89",
      "studyTime 1.3",
      "rebuildTime 4.1",
      "winStreak 2",
      "streak 3",
      "rounds 12",
      "days 3",
    ]);
    expect(card?.figures[1]).toEqual({
      id: "rating",
      figure: { value: 1102, unit: "rating", digits: 0 },
      context: { kind: "rating", values: { sign: "up", change: 30, rounds: 1 } },
      trend: { direction: "up", amount: 30 },
    });
    expect(card?.rounds).toBe(12);
  });

  it("leads with the strongest figure above zero and keeps a zero figure in the grid", () => {
    const card = shareCardOf(tilesFor("twoRounds", { game: { rating: 1000, winStreak: 0, changes: [] } }), 2);

    expect(ids(card)?.slice(0, 2)).toEqual(["rating 1000", "bestAccuracy 83"]);
    expect(ids(card)).toContain("winStreak 0");
  });

  it("leaves out stale and warming figures, and offers no card before the first round", () => {
    expect(ids(shareCardOf(tilesFor("stale"), 30))?.some((id) => id.startsWith("span"))).toBe(false);
    expect(shareCardOf(tilesFor("newVisitor", { today: "" }), 0)).toBeNull();
  });
});

describe("unlocksOf", () => {
  it("lists a warming player's locked figures outside today's row, what one round opens first and a choice last", () => {
    expect(unlocksOf(tilesFor("twoRounds")).map((locked) => [locked.id, locked.state === "warming" ? locked.need : locked.cta])).toEqual([
      ["rating", "play"],
      ["span", { qualifyingRounds: 1 }],
      ["winStreak", "play"],
      ["board", "play"],
      ["piecesHeld", { rounds: 3, days: 1 }],
      ["curve", { reviews: 3 }],
      ["speed", { rounds: 4 }],
      ["plans", "choose"],
      ["goal", "choose"],
    ]);
  });

  it("leaves out every figure a long record can read", () => {
    expect(unlocksOf(tilesFor("spanClimber", { game: { rating: 1240, winStreak: 2, changes: [8] } })).map(({ id }) => id)).toEqual(["board", "curve", "plans", "goal"]);
  });
});
