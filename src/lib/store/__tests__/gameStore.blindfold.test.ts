import { useGameStore } from "@/lib/store/gameStore";

const store = () => useGameStore.getState();
const configOf = () => {
  const { round } = store();
  if (round.phase === "idle") throw new Error("no round");
  return round.config;
};

describe("a blindfold round in the store", () => {
  let gtag: jest.Mock;

  beforeEach(() => {
    gtag = jest.fn();
    window.gtag = gtag;
  });

  afterEach(() => {
    store().resetGame();
    Reflect.deleteProperty(window, "gtag");
  });

  it("studies with the blindfold flag and reports the mode on round_start", () => {
    store().startGame(6, 10, "guide_cta", undefined, true);

    expect(configOf()).toEqual({ pieceCount: 6, studyMs: 10_000, source: "guide_cta", blindfold: true });
    expect(gtag.mock.calls).toEqual([["event", "round_start", { piece_count: 6, memorize_time: 10, round_source: "guide_cta", round_mode: "blindfold" }]]);
  });

  it("does not carry the flag into the next board round", () => {
    store().startGame(6, 10, "guide_cta", undefined, true);
    store().resetGame();
    gtag.mockClear();

    store().countInGame(6, 10, "game_form");
    store().endCountdown();

    expect(store().round.phase).toBe("study");
    expect(configOf()).toEqual({ pieceCount: 6, studyMs: 10_000, source: "game_form" });
    expect(gtag.mock.calls).toEqual([["event", "round_start", { piece_count: 6, memorize_time: 10, round_source: "game_form" }]]);
  });

  it("counts a blindfold round in, and the first-round intro keeps the flag", () => {
    store().countInGame(4, 8, "try_again", true);
    expect(configOf()).toMatchObject({ blindfold: true });
    store().resetGame();

    store().prepareGame(4, 8, "guide_cta", undefined, true);
    expect(store().round.phase).toBe("ready");
    expect(configOf()).toMatchObject({ blindfold: true });
  });

  it("reports the mode on round_complete and records it with the round", async () => {
    store().startGame(2, 10, "game_form", undefined, true);
    store().dispatch({ type: "studyEnded", now: performance.now() });
    gtag.mockClear();

    await store().submitSolution();

    expect(gtag.mock.calls).toEqual([
      ["event", "round_complete", { piece_count: 2, memorize_time: 10, correct_pieces: 0, accuracy: 0, round_source: "game_form", round_mode: "blindfold" }],
    ]);
    expect(store().gameState.labRound?.facts.blindfold).toBe(true);
  });
});
