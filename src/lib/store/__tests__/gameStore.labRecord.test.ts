import { useGameStore } from "@/lib/store/gameStore";
import { recordLabRound } from "@/lib/lab/recordRound";
import { GAME_STORAGE_KEY } from "@/lib/game/configPrefill";

jest.mock("@/lib/lab/recordRound", () => ({ recordLabRound: jest.fn(() => Promise.resolve(true)) }));

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("lab record from a finished game round", () => {
  let clock = 0;
  beforeEach(() => {
    clock = 0;
    jest.spyOn(performance, "now").mockImplementation(() => clock);
    jest.mocked(recordLabRound).mockClear();
  });
  afterEach(() => {
    useGameStore.getState().resetGame();
    jest.restoreAllMocks();
  });

  it("records both positions, the timings, where the round started and the placement", async () => {
    useGameStore.getState().startGame(6, 10, "game_form");
    useGameStore.getState().endMemorizationPhase(9.5);
    clock = 1000;
    useGameStore.getState().startSolutionPhase();
    clock = 2400;
    useGameStore.getState().placePiece("e1", "K");
    useGameStore.getState().submitSolution(12.25);
    await flush();

    const { originalPosition, labRoundId } = useGameStore.getState().gameState;
    expect(labRoundId).toMatch(/^[0-9a-f-]{36}$/);
    expect(recordLabRound).toHaveBeenCalledTimes(1);
    expect(recordLabRound).toHaveBeenCalledWith({
      id: labRoundId,
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
    });
  });

  it("keeps the placements in the order played, timed from the start of the rebuild, and counts the lift", async () => {
    useGameStore.getState().startGame(6, 10, "home_quick");
    useGameStore.getState().endMemorizationPhase(10);
    clock = 500;
    useGameStore.getState().startSolutionPhase();
    clock = 1500;
    useGameStore.getState().placePiece("d4", "q");
    clock = 2600;
    useGameStore.getState().placePiece("a8", "k");
    clock = 3000;
    useGameStore.getState().removePiece("d4");
    clock = 3100;
    useGameStore.getState().removePiece("h5");
    clock = 3900;
    useGameStore.getState().placePiece("d5", "q");
    useGameStore.getState().submitSolution(4);
    await flush();

    expect(jest.mocked(recordLabRound).mock.calls[0][0]).toMatchObject({
      startSource: "home_quick",
      placements: [[1000, 35, "q"], [2100, 0, "k"], [3400, 27, "q"]],
      removals: 1,
    });
  });

  it("leaves out a placement the board refused", async () => {
    useGameStore.getState().startGame(6, 10, "try_again");
    useGameStore.getState().endMemorizationPhase(10);
    useGameStore.getState().startSolutionPhase();
    useGameStore.getState().placePiece("e1", "K");
    useGameStore.getState().placePiece("e2", "K");
    useGameStore.getState().submitSolution(4);
    await flush();

    expect(jest.mocked(recordLabRound).mock.calls[0][0]).toMatchObject({
      startSource: "try_again",
      placements: [[0, 60, "K"]],
      removals: 0,
    });
  });

  it("starts a reset or a try again with no placements and only the new start", () => {
    useGameStore.getState().startGame(6, 10, "home_quick");
    useGameStore.getState().endMemorizationPhase(10);
    useGameStore.getState().startSolutionPhase();
    useGameStore.getState().placePiece("e1", "K");
    const played = useGameStore.getState().gameState.placementLog?.placements;

    useGameStore.getState().resetGame();
    const reset = useGameStore.getState().gameState;
    useGameStore.getState().startGame(6, 10, "try_again");
    const again = useGameStore.getState().gameState;

    expect(played).toEqual([[0, 60, "K"]]);
    expect([reset.placementLog, reset.startSource]).toEqual([undefined, undefined]);
    expect([again.placementLog, again.startSource]).toEqual([undefined, "try_again"]);
  });

  it("gives each scored round its own lab id, clears it with the round and never stores it", async () => {
    const scoreRound = () => {
      useGameStore.getState().startGame(6, 10, "home_quick");
      useGameStore.getState().endMemorizationPhase(10);
      useGameStore.getState().startSolutionPhase();
      useGameStore.getState().submitSolution(4);
      return useGameStore.getState().gameState.labRoundId;
    };
    const first = scoreRound();
    useGameStore.getState().startGame(6, 10, "try_again");
    const afterTryAgain = useGameStore.getState().gameState.labRoundId;
    const second = scoreRound();
    useGameStore.getState().resetGame();
    await flush();

    expect(first).not.toBe(second);
    expect([afterTryAgain, useGameStore.getState().gameState.labRoundId]).toEqual([undefined, undefined]);
    expect(jest.mocked(recordLabRound).mock.calls.map(([facts]) => facts.id)).toEqual([first, second]);
    const stored = window.localStorage.getItem(GAME_STORAGE_KEY) ?? "";
    expect(stored).toContain('"pieceCount":6');
    expect(stored).not.toContain("labRoundId");
  });

  it("plays a set board's position and records the round as that day's daily board, and a try again after it as a normal round", async () => {
    const fen = "8/8/8/1pQ4k/P2p4/8/8/1K6 b - - 0 1";
    useGameStore.getState().startGame(6, 10, "daily", { kind: "daily", day: "2026-10-09", fen });
    const shown = useGameStore.getState().gameState.originalPosition;
    useGameStore.getState().endMemorizationPhase(10);
    useGameStore.getState().startSolutionPhase();
    useGameStore.getState().submitSolution(4);
    useGameStore.getState().startGame(6, 10, "try_again");
    useGameStore.getState().endMemorizationPhase(10);
    useGameStore.getState().startSolutionPhase();
    useGameStore.getState().submitSolution(4);
    await flush();

    const [daily, again] = jest.mocked(recordLabRound).mock.calls.map(([facts]) => facts);
    expect(shown).toBe(fen);
    expect(daily).toMatchObject({ targetFen: fen, startSource: "daily", kind: "daily", dailyDay: "2026-10-09" });
    expect([again.startSource, again.kind, again.dailyDay]).toEqual(["try_again", undefined, undefined]);
  });
});
