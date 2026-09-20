import { WORLD_CODE } from "@/lib/leaderboard/countries";

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
    expect(persisted.state).toEqual({ showCoordinates: false, countryCode: WORLD_CODE });
  });

  it("defaults showCoordinates to true when nothing is stored", async () => {
    const { useSettingsStore } = await import("../settingsStore");

    expect(useSettingsStore.getState().showCoordinates).toBe(true);
  });

  it("migrates a v1 value by keeping showCoordinates and adding the default country", async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ state: { showCoordinates: false }, version: 1 }),
    );

    const { useSettingsStore } = await import("../settingsStore");
    const state = useSettingsStore.getState();

    expect(state.showCoordinates).toBe(false);
    expect(state.countryCode).toBe(WORLD_CODE);
  });

  it("falls back to the world code when a stored v2 country is not a known code", async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ state: { showCoordinates: true, countryCode: "xx" }, version: 2 }),
    );

    const { useSettingsStore } = await import("../settingsStore");

    expect(useSettingsStore.getState().countryCode).toBe(WORLD_CODE);
  });

  it("falls back to the world code when a stored v2 country is not a string", async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ state: { showCoordinates: true, countryCode: 42 }, version: 2 }),
    );

    const { useSettingsStore } = await import("../settingsStore");

    expect(useSettingsStore.getState().countryCode).toBe(WORLD_CODE);
  });

  it("keeps a stored v2 country that is a known code", async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ state: { showCoordinates: true, countryCode: "SG" }, version: 2 }),
    );

    const { useSettingsStore } = await import("../settingsStore");

    expect(useSettingsStore.getState().countryCode).toBe("SG");
  });
});
