import { useGameStore } from "@/lib/store/gameStore";
import { recordLabRound } from "@/lib/lab/recordRound";

jest.mock("@/lib/lab/recordRound", () => ({ recordLabRound: jest.fn(() => Promise.resolve(true)) }));

describe("lab record from a finished game round", () => {
  afterEach(() => useGameStore.getState().resetGame());

  it("records both positions and the timings when the solution is submitted", () => {
    useGameStore.getState().startGame(6, 10, "game_form");
    useGameStore.getState().endMemorizationPhase(9.5);
    useGameStore.getState().startSolutionPhase();
    useGameStore.getState().placePiece("e1", "K");
    useGameStore.getState().submitSolution(12.25);

    const { originalPosition } = useGameStore.getState().gameState;
    expect(recordLabRound).toHaveBeenCalledTimes(1);
    expect(recordLabRound).toHaveBeenCalledWith({
      source: "game",
      pieceCount: 6,
      memorizeSeconds: 10,
      targetFen: originalPosition,
      placedFen: "8/8/8/8/8/8/8/4K3 w - - 0 1",
      memorizeMs: 9500,
      solveMs: 12250,
    });
  });
});
