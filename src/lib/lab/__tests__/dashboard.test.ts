import { dashboardOf, shareCardOf, type DashboardTile, type DashboardTileId } from "@/lib/lab/dashboard";
import { dayDate } from "@/lib/lab/engine";
import { deriveLab } from "@/lib/lab/metrics";
import { personaChoices, personaEntries, personaRounds, PERSONA_TODAY, type PersonaName } from "@/lib/lab/personas";
import { EMPTY_SUMMARY, summarize } from "@/lib/lab/summary";

const QUICK = "/game?pieceCount=6&memorizeTime=10&source=dashboard";

function tilesFor(name: PersonaName, { today = PERSONA_TODAY, chooseHref = "/#record" as string | null } = {}) {
  const records = personaRounds(name, PERSONA_TODAY);
  const summary = records.length ? summarize(records) : EMPTY_SUMMARY;
  const choices = personaChoices(name);
  const results = deriveLab({ records, summary, today, ...choices });
  return dashboardOf({ results, summary, records, weekGoal: 5, entries: personaEntries(name), today, utcDay: today, dailyOpened: null, chooseHref });
}

const tile = (tiles: readonly DashboardTile[], id: DashboardTileId) => tiles.find((candidate) => candidate.id === id);

describe("dashboardOf", () => {
  it("draws the headline figures and totals of a ready player, each with what stands behind it", () => {
    const tiles = tilesFor("spanClimber");

    expect(tiles.slice(0, 6)).toEqual([
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

  it("reads the diagnosis tiles from the weakest line and piece type", () => {
    const tiles = tilesFor("spanClimber");

    expect(tile(tiles, "missMap")).toEqual({
      id: "missMap",
      state: "ready",
      figure: { value: 19, unit: "percent", digits: 0 },
      context: { kind: "missLine", values: { line: "file", name: "b", shown: 132 } },
    });
    expect(tile(tiles, "typeRecall")).toEqual({
      id: "typeRecall",
      state: "ready",
      figure: { value: 85, unit: "percent", digits: 0 },
      context: { kind: "pieceType", values: { type: "n", shown: 103 } },
    });
  });

  it("gives a warming player what each figure still needs and a round that earns it", () => {
    const tiles = tilesFor("twoRounds");

    expect(tiles.slice(0, 4)).toEqual([
      { id: "span", state: "warming", need: { qualifyingRounds: 1 }, rig: null, href: QUICK },
      { id: "piecesHeld", state: "warming", need: { rounds: 3, days: 1 }, rig: null, href: QUICK },
      { id: "speed", state: "warming", need: { rounds: 4 }, rig: { pieceCount: 6, memorizeSeconds: 10 }, href: QUICK },
      { id: "streak", state: "warming", need: { days: 1 }, rig: null, href: QUICK },
    ]);
  });

  it("links a goal that has no round yet to a round at the goal's piece count", () => {
    const records = personaRounds("threeDays", PERSONA_TODAY);
    const summary = summarize(records);
    const target = { pieceCount: 9, accuracy: 90, createdDay: PERSONA_TODAY };
    const results = deriveLab({ records, summary, today: PERSONA_TODAY, plan: null, target });
    const tiles = dashboardOf({ results, summary, records, weekGoal: 5, entries: null, today: PERSONA_TODAY, utcDay: PERSONA_TODAY, dailyOpened: null, chooseHref: null });

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
      ["span", "empty", QUICK],
      ["piecesHeld", "empty", QUICK],
      ["speed", "empty", QUICK],
      ["streak", "empty", QUICK],
      ["rounds", "empty", QUICK],
      ["days", "empty", QUICK],
      ["trend", "empty", QUICK],
      ["daily", "empty", "/game?pieceCount=6&memorizeTime=10&source=daily"],
      ["week", "empty", QUICK],
      ["curve", "empty", QUICK],
      ["missMap", "empty", QUICK],
      ["typeRecall", "empty", QUICK],
      ["insights", "empty", QUICK],
      ["notebook", "empty", QUICK],
      ["plans", "empty", "/#record"],
      ["goal", "empty", "/#record"],
      ["bests", "empty", QUICK],
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
  it("carries the ready headline figures and the rounds played", () => {
    expect(shareCardOf(tilesFor("threeDays"), 12)).toEqual({
      figures: [
        { id: "span", figure: { value: 6, unit: "pieces", digits: 0 } },
        { id: "piecesHeld", figure: { value: 5.2, unit: "pieces", digits: 1 } },
        { id: "speed", figure: { value: 4.6, unit: "secondsPerPiece", digits: 1 } },
        { id: "streak", figure: { value: 3, unit: "days", digits: 0 } },
      ],
      rounds: 12,
    });
  });

  it("offers no card while every headline figure is warming, empty or stale", () => {
    expect(shareCardOf(tilesFor("twoRounds"), 2)).toBeNull();
    expect(shareCardOf(tilesFor("newVisitor", { today: "" }), 0)).toBeNull();
    expect(shareCardOf(tilesFor("stale"), 30)).toBeNull();
  });
});
