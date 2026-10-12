import { dashboardOf, shareCardOf, type DashboardTile, type DashboardTileId, type GameStanding } from "@/lib/lab/dashboard";
import { dayDate } from "@/lib/lab/engine";
import { deriveLab } from "@/lib/lab/metrics";
import { personaChoices, personaEntries, personaRounds, PERSONA_TODAY, type PersonaName } from "@/lib/lab/personas";
import { EMPTY_SUMMARY, summarize } from "@/lib/lab/summary";

const QUICK = "/game?pieceCount=6&memorizeTime=10&source=dashboard";

const BEST_ACCURACY = 100;
const BEST_AT = { source: "game", pieceCount: 14, memorizeSeconds: 10 };
// Pieces held over the same ten rounds is 13.8 of 14, the same reading.
const RECENT_ACCURACY = 99;
const NO_GAME = { game: null, winAccuracy: 70 } as const;

function tilesFor(name: PersonaName, { today = PERSONA_TODAY, chooseHref = "/#record" as string | null, game = null as GameStanding | null } = {}) {
  const records = personaRounds(name, PERSONA_TODAY);
  const summary = records.length ? summarize(records) : EMPTY_SUMMARY;
  const choices = personaChoices(name);
  const results = deriveLab({ records, summary, today, ...choices });
  return dashboardOf({ results, summary, records, weekGoal: 5, entries: personaEntries(name), today, utcDay: today, dailyOpened: null, chooseHref, game, winAccuracy: 70 });
}

const tile = (tiles: readonly DashboardTile[], id: DashboardTileId) => tiles.find((candidate) => candidate.id === id);

describe("dashboardOf", () => {
  it("draws the headline figures and totals of a ready player, each with what stands behind it", () => {
    const tiles = tilesFor("spanClimber");

    expect(["span", "piecesHeld", "speed", "streak", "rounds", "days"].map((id) => tile(tiles, id as DashboardTileId))).toEqual([
      { id: "span", state: "ready", figure: { value: 14, unit: "pieces", digits: 0 }, context: { kind: "span", values: { rounds: 19, accuracy: 80, memorizeSeconds: 10 } } },
      { id: "piecesHeld", state: "ready", figure: { value: 13.8, unit: "pieces", digits: 1 }, context: { kind: "recent", values: { rounds: 10 } } },
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
      ["rating", "empty", QUICK],
      ["span", "empty", QUICK],
      ["piecesHeld", "empty", QUICK],
      ["speed", "empty", QUICK],
      ["bestAccuracy", "empty", QUICK],
      ["recentAccuracy", "empty", QUICK],
      ["winStreak", "empty", QUICK],
      ["streak", "empty", QUICK],
      ["rounds", "empty", QUICK],
      ["days", "empty", QUICK],
      ["daily", "empty", "/game?pieceCount=6&memorizeTime=10&source=daily"],
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
      context: { kind: "recent", values: { rounds: 10 } },
    });
  });

  it("reads the rating with its change over the last ten rated rounds, and the win streak, from the game store", () => {
    const changes = [12, -4, 20, 8, 0, 6, 9, -2, 15, 11, 40];
    const tiles = tilesFor("threeDays", { game: { rating: 1240, winStreak: 4, changes } });

    expect(tile(tiles, "rating")).toEqual({
      id: "rating",
      state: "ready",
      figure: { value: 1240, unit: "rating", digits: 0 },
      context: { kind: "rating", values: { sign: "up", change: 75, rounds: 10 } },
    });
    expect(tile(tiles, "winStreak")).toEqual({
      id: "winStreak",
      state: "ready",
      figure: { value: 4, unit: "rounds", digits: 0 },
      context: { kind: "winStreak", values: { accuracy: 70 } },
    });
    expect(tile(tilesFor("threeDays", { game: { rating: 980, winStreak: 0, changes: [-20] } }), "rating")).toMatchObject({
      context: { kind: "rating", values: { sign: "down", change: 20, rounds: 1 } },
    });
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

    expect(ids(card)).toEqual(["span 6", "rating 1102", "piecesHeld 5.2", "speed 4.6", "bestAccuracy 100", "recentAccuracy 87", "winStreak 2", "streak 3", "rounds 12", "days 3"]);
    expect(card?.figures[1]).toEqual({ id: "rating", figure: { value: 1102, unit: "rating", digits: 0 }, context: { kind: "rating", values: { sign: "up", change: 30, rounds: 1 } } });
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
