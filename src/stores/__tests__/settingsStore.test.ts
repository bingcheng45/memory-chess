import { WORLD_CODE } from "@/lib/leaderboard/countries";

const STORAGE_KEY = "memory-chess-settings";

async function loadWith(stored: unknown) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  const { useSettingsStore } = await import("../settingsStore");
  return useSettingsStore;
}

const persisted = () => JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");

describe("settingsStore migration", () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.resetModules();
  });

  it("loads a v0 stored object and drops every dead key", async () => {
    const store = await loadWith({
      state: { difficulty: "hard", memorizationTime: 20, showCoordinates: false },
      version: 0,
    });

    expect(store.getState().countryCode).toBe(WORLD_CODE);
    expect(store.getState()).not.toHaveProperty("showCoordinates");
    expect(persisted()).toEqual({ state: { countryCode: WORLD_CODE }, version: 3 });
  });

  it("ignores a v2 player's stored showCoordinates false and keeps their country", async () => {
    const store = await loadWith({ state: { showCoordinates: false, countryCode: "SG" }, version: 2 });

    expect(store.getState()).not.toHaveProperty("showCoordinates");
    expect(store.getState().countryCode).toBe("SG");
    expect(persisted()).toEqual({ state: { countryCode: "SG" }, version: 3 });
  });

  it("defaults the country to the world code when nothing is stored", async () => {
    const { useSettingsStore } = await import("../settingsStore");

    expect(useSettingsStore.getState().countryCode).toBe(WORLD_CODE);
  });

  it("falls back to the world code when a stored country is not a known code", async () => {
    const store = await loadWith({ state: { countryCode: "xx" }, version: 3 });

    expect(store.getState().countryCode).toBe(WORLD_CODE);
  });

  it("falls back to the world code when a stored country is not a string", async () => {
    const store = await loadWith({ state: { countryCode: 42 }, version: 3 });

    expect(store.getState().countryCode).toBe(WORLD_CODE);
  });

  it("keeps a stored country that is a known code", async () => {
    const store = await loadWith({ state: { countryCode: "SG" }, version: 3 });

    expect(store.getState().countryCode).toBe("SG");
  });
});
