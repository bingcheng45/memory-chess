import { useGameStore } from "@/lib/store/gameStore";
import { validateMemorizationPosition } from "@/lib/utils/memorizationPosition";

describe("active game store position generation", () => {
  afterEach(() => {
    useGameStore.getState().resetGame();
  });

  it("stores a validated memorization position with the requested piece count", () => {
    useGameStore.getState().startGame(12, 8);

    const { gameState, memorizationChess } = useGameStore.getState();
    expect(gameState.isPlaying).toBe(true);
    expect(gameState.originalPosition).toBe(memorizationChess?.fen());
    expect(
      validateMemorizationPosition(gameState.originalPosition!, 12),
    ).toMatchObject({ valid: true, violations: [] });
  });
});
