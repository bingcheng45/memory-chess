import { useGameStore, standingOf } from "@/lib/store/gameStore";
import { GAME_STORAGE_KEY } from "@/lib/game/configPrefill";

const store = () => useGameStore.getState();

function playAs(skillRating: number, streak: number, rd: number, rounds: number) {
  useGameStore.setState({ gameState: { ...store().gameState, skillRating, streak }, certainty: { rd, rounds } });
}

describe("restoring an imported standing", () => {
  afterEach(() => playAs(1000, 0, 350, 0));

  it("takes the file's rating of 1234, streak of 7 and certainty onto a new device, and persists them", () => {
    playAs(1000, 0, 350, 0);

    const restored = store().restoreStanding({ skillRating: 1234, streak: 7, certainty: { rd: 80.5, rounds: 42 } });

    expect(restored).toBe(true);
    expect(standingOf(store())).toEqual({ skillRating: 1234, streak: 7, certainty: { rd: 80.5, rounds: 42 } });
    const saved = JSON.parse(window.localStorage.getItem(GAME_STORAGE_KEY) ?? "{}").state;
    expect([saved.gameState.skillRating, saved.gameState.streak, saved.certainty]).toEqual([1234, 7, { rd: 80.5, rounds: 42 }]);
  });

  it("keeps a device that has played as many rated rounds or more, so a rating is never lowered", () => {
    playAs(1500, 3, 70, 42);

    const restored = [
      store().restoreStanding({ skillRating: 1234, streak: 7, certainty: { rd: 80, rounds: 42 } }),
      store().restoreStanding({ skillRating: 2000, streak: 9, certainty: { rd: 60, rounds: 10 } }),
    ];

    expect(restored).toEqual([false, false]);
    expect(standingOf(store())).toEqual({ skillRating: 1500, streak: 3, certainty: { rd: 70, rounds: 42 } });
  });
});
