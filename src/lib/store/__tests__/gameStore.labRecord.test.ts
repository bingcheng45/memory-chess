import { useGameStore } from "@/lib/store/gameStore";
import { recordLabRound } from "@/lib/lab/recordRound";
import { GAME_STORAGE_KEY } from "@/lib/game/configPrefill";
import type { SquareName } from "@/lib/game/board";
import type { SetBoard } from "@/lib/types/game";
import type { LabPiece } from "@/lib/round/round";

jest.mock("@/lib/lab/recordRound", () => ({ recordLabRound: jest.fn(() => Promise.resolve(true)) }));

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
const store = () => useGameStore.getState();
const WK: LabPiece = { color: "white", type: "king" };
const BK: LabPiece = { color: "black", type: "king" };
const BQ: LabPiece = { color: "black", type: "queen" };

function tap(square: SquareName, piece: LabPiece, now: number) {
  const { round } = store();
  const selected = round.phase === "rebuild" ? round.selected : null;
  if (selected?.color !== piece.color || selected.type !== piece.type) store().dispatch({ type: "select", piece });
  store().dispatch({ type: "tapSquare", square, now });
}

describe("lab record from a finished game round", () => {
  let clock = 0;
  beforeEach(() => {
    clock = 0;
    jest.spyOn(performance, "now").mockImplementation(() => clock);
    jest.mocked(recordLabRound).mockClear();
  });
  afterEach(() => {
    store().resetGame();
    jest.restoreAllMocks();
  });

  it("records both positions, the timings, where the round started and the placement", async () => {
    store().startGame(6, 10, "game_form");
    store().dispatch({ type: "studyEnded", now: 9500 });
    tap("e1", WK, 10900);
    store().submitSolution(21750);
    await flush();

    const { originalPosition, labRound } = store().gameState;
    expect(labRound?.facts.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(recordLabRound).toHaveBeenCalledTimes(1);
    expect(recordLabRound).toHaveBeenCalledWith(labRound?.facts, new Date(labRound?.endedAt ?? NaN));
    expect(labRound?.facts).toEqual({
      id: labRound?.facts.id,
      source: "game",
      startSource: "game_form",
      pieceCount: 6,
      memorizeSeconds: 10,
      targetFen: originalPosition,
      placedFen: "8/8/8/8/8/8/8/4K3 w - - 0 1",
      memorizeMs: 9500,
      solveMs: 12250,
      placements: [[1400, 60, "K"]],
      removals: 0,
      board: undefined,
    });
  });

  it("keeps the placements in the order played, timed from the start of the rebuild, and counts the lift", async () => {
    store().startGame(6, 10, "home_quick");
    store().dispatch({ type: "studyEnded", now: 500 });
    tap("d4", BQ, 1500);
    tap("a8", BK, 2600);
    tap("d4", BQ, 3000);
    tap("d5", BQ, 3900);
    store().submitSolution(4500);
    await flush();

    expect(jest.mocked(recordLabRound).mock.calls[0][0]).toMatchObject({
      startSource: "home_quick",
      placements: [[1000, 35, "q"], [2100, 0, "k"], [3400, 27, "q"]],
      removals: 1,
    });
  });

  it("leaves out a placement the inventory refuses", async () => {
    store().startGame(6, 10, "try_again");
    store().dispatch({ type: "studyEnded", now: 0 });
    tap("e1", WK, 0);
    tap("e2", WK, 0);
    store().submitSolution(4000);
    await flush();

    expect(jest.mocked(recordLabRound).mock.calls[0][0]).toMatchObject({
      startSource: "try_again",
      placements: [[0, 60, "K"]],
      removals: 0,
    });
  });

  it("starts a reset or a try again with no placements and only the new start", () => {
    store().startGame(6, 10, "home_quick");
    store().dispatch({ type: "studyEnded", now: 0 });
    tap("e1", WK, 0);
    const played = store().round;

    store().resetGame();
    const reset = store();
    store().startGame(6, 10, "try_again");
    const again = store();

    expect(played.phase === "rebuild" && played.log.placements).toEqual([[0, 60, "K"]]);
    expect([reset.round.phase, reset.gameState.startSource]).toEqual(["idle", undefined]);
    expect([again.round.phase, again.gameState.startSource]).toEqual(["study", "try_again"]);
  });

  it("gives each scored round its own lab id, clears it with the round and never stores it", async () => {
    const scoreRound = () => {
      store().startGame(6, 10, "home_quick");
      store().dispatch({ type: "studyEnded", now: 0 });
      store().submitSolution(4000);
      return store().gameState.labRound?.facts.id;
    };
    const first = scoreRound();
    store().startGame(6, 10, "try_again");
    const afterTryAgain = store().gameState.labRound?.facts.id;
    const second = scoreRound();
    store().resetGame();
    await flush();

    expect(first).not.toBe(second);
    expect([afterTryAgain, store().gameState.labRound?.facts.id]).toEqual([undefined, undefined]);
    expect(jest.mocked(recordLabRound).mock.calls.map(([facts]) => facts.id)).toEqual([first, second]);
    const stored = window.localStorage.getItem(GAME_STORAGE_KEY) ?? "";
    expect(stored).toContain('"pieceCount":6');
    expect(stored).not.toContain("labRound");
  });

  it("plays a set board's position and records the round as that day's daily board, and a try again after it as a normal round", async () => {
    const fen = "8/8/8/1pQ4k/P2p4/8/8/1K6 b - - 0 1";
    store().startGame(6, 10, "daily", { kind: "daily", day: "2026-10-09", fen });
    const shown = store().gameState.originalPosition;
    const round = store().round;
    store().dispatch({ type: "studyEnded", now: 10000 });
    store().submitSolution(14000);
    store().startGame(6, 10, "try_again");
    store().dispatch({ type: "studyEnded", now: 10000 });
    store().submitSolution(14000);
    await flush();

    const [daily, again] = jest.mocked(recordLabRound).mock.calls.map(([facts]) => facts);
    expect(shown).toBe(fen);
    expect(round.phase === "study" && round.target).toEqual({
      b5: { color: "black", type: "pawn" },
      c5: { color: "white", type: "queen" },
      h5: { color: "black", type: "king" },
      a4: { color: "white", type: "pawn" },
      d4: { color: "black", type: "pawn" },
      b1: { color: "white", type: "king" },
    });
    expect(daily).toMatchObject({ targetFen: fen, startSource: "daily", board: { kind: "daily", day: "2026-10-09", fen } });
    expect([again.startSource, again.board]).toEqual(["try_again", undefined]);
  });

  it("replays a board from the lab record for review and hands the review's link to the record", async () => {
    const board = { kind: "review", fen: "4k3/8/8/3q4/8/5N2/8/4K3 w - - 0 1", reviewOf: "first-round", firstDay: "2026-10-06", step: 1 } as const;
    store().startGame(4, 10, "review", board);
    const shown = store().gameState.originalPosition;
    store().dispatch({ type: "studyEnded", now: 10000 });
    store().submitSolution(14000);
    await flush();

    expect(shown).toBe(board.fen);
    expect(jest.mocked(recordLabRound).mock.calls[0][0]).toMatchObject({ targetFen: board.fen, startSource: "review", pieceCount: 4, board });
  });

  it("keeps the skill rating, win streak and history through a review round, while a daily round moves all three", () => {
    const fen = "4k3/8/8/8/8/8/8/4K3 w - - 0 1";
    const playPerfect = (source: "daily" | "review", board: SetBoard) => {
      store().startGame(2, 10, source, board);
      store().dispatch({ type: "studyEnded", now: 10000 });
      tap("e8", BK, 11000);
      tap("e1", WK, 12000);
      store().submitSolution(14000);
      const { skillRating, streak, accuracy } = store().gameState;
      return { skillRating, streak, accuracy };
    };
    useGameStore.setState(({ gameState }) => ({ history: [], gameState: { ...gameState, skillRating: 1000, streak: 0 } }));

    const review = playPerfect("review", { kind: "review", fen, reviewOf: "first-round", firstDay: "2026-10-06", step: 1 });
    const daily = playPerfect("daily", { kind: "daily", day: "2026-10-09", fen });

    expect(review).toEqual({ skillRating: 1000, streak: 0, accuracy: 100 });
    expect(daily).toEqual({ skillRating: 1114, streak: 1, accuracy: 100 });
    expect(store().history.map(({ skillRatingChange, streak }) => [skillRatingChange, streak])).toEqual([[114, 1]]);
  });
});
