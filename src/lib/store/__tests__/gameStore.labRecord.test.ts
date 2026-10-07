import { useGameStore } from "@/lib/store/gameStore";
import { recordLabRound } from "@/lib/lab/recordRound";

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

    const { originalPosition } = useGameStore.getState().gameState;
    expect(recordLabRound).toHaveBeenCalledTimes(1);
    expect(recordLabRound).toHaveBeenCalledWith({
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
});
