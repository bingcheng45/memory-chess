const STORAGE_KEY = "memory-chess-settings";

describe("settingsStore migration", () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.resetModules();
  });

  it("loads a v0 stored object with showCoordinates and drops the dead keys", async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        state: { difficulty: "hard", memorizationTime: 20, showCoordinates: false },
        version: 0,
      }),
    );

    const { useSettingsStore } = await import("../settingsStore");
    const state = useSettingsStore.getState();

    expect(state.showCoordinates).toBe(false);
    expect(state).not.toHaveProperty("difficulty");
    expect(state).not.toHaveProperty("memorizationTime");

    const persisted = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
    expect(persisted.state).toEqual({ showCoordinates: false });
  });

  it("defaults showCoordinates to true when nothing is stored", async () => {
    const { useSettingsStore } = await import("../settingsStore");

    expect(useSettingsStore.getState().showCoordinates).toBe(true);
  });
});
