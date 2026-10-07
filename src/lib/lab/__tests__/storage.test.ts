/** @jest-environment node */
import { forceCloseDatabase, IDBFactory } from "fake-indexeddb";
import { withoutPlacements } from "@/lib/lab/record";
import { createLabStore, PERSIST_AFTER_ROUNDS, PLACEMENT_KEEP, ROUND_CAP, type LabStoreDeps } from "@/lib/lab/storage";
import { buildExport, parseImport } from "@/lib/lab/transfer";
import { round, roundV2, TARGET } from "./fixtures";

const NOW = Date.UTC(2026, 9, 8);
const MISSED_QUEEN = "4k3/8/8/8/8/5N2/8/4K3";

/** A player past the cap: three early rounds on their own days, the first with a missed queen, then a long run. */
function longHistory() {
  return Array.from({ length: ROUND_CAP + 3 }, (_, index) =>
    round({
      id: `h${index}`,
      endedAt: index + 1,
      localDay: index < 3 ? `2026-01-0${index + 1}` : "2026-10-07",
      source: index === 1 ? "calibration" : "game",
      placedFen: index === 0 ? MISSED_QUEEN : TARGET,
    }),
  );
}

async function exportFile(store: ReturnType<typeof createLabStore>): Promise<string> {
  const summary = await store.readSummary();
  return JSON.stringify(buildExport(await store.listRounds(), NOW, summary));
}

async function importFile(store: ReturnType<typeof createLabStore>, text: string): Promise<number> {
  const parsed = parseImport(text, NOW);
  if (!parsed.ok) throw new Error(parsed.reason);
  const summary = typeof parsed.summary === "object" ? parsed.summary : null;
  return (summary && (await store.restore(parsed.rounds, summary))) ?? store.mergeRounds(parsed.rounds);
}

function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => void data.delete(key),
    setItem: (key, value) => void data.set(key, value),
  };
}

/** One lock name at a time, granted in request order, like navigator.locks across tabs. */
function queuedLocks(): LockManager {
  const tails = new Map<string, Promise<unknown>>();
  return {
    request: (name: string, callback: () => Promise<unknown>) => {
      const run = (tails.get(name) ?? Promise.resolve()).then(() => callback());
      tails.set(name, run.catch(() => undefined));
      return run;
    },
  } as unknown as LockManager;
}

function deps(overrides: Partial<LabStoreDeps> = {}): LabStoreDeps & { persist: jest.Mock } {
  const persist = jest.fn(() => Promise.resolve(true));
  return {
    indexedDB: new IDBFactory(),
    localStorage: memoryStorage(),
    storageManager: { persist } as unknown as StorageManager,
    locks: undefined,
    persist,
    ...overrides,
  };
}

describe("lab store", () => {
  it("saves a round, lists it and updates the summary", async () => {
    const store = createLabStore(deps());

    expect(await store.addRound(round())).toBe(true);
    expect(await store.listRounds()).toEqual([round()]);
    expect(await store.readSummary()).toMatchObject({ rounds: 1, days: ["2026-10-07"] });
  });

  it("writes the same round id once", async () => {
    const store = createLabStore(deps());
    await store.addRound(round());
    await store.addRound(round());

    expect((await store.listRounds()).length).toBe(1);
    expect((await store.readSummary()).rounds).toBe(1);
  });

  it("merges an import by id, so importing twice adds nothing", async () => {
    const store = createLabStore(deps());
    await store.addRound(round({ id: "a", endedAt: 1 }));
    const file = [round({ id: "a", endedAt: 1 }), round({ id: "b", endedAt: 5 }), round({ id: "c", endedAt: 6 })];

    expect(await store.mergeRounds(file)).toBe(2);
    expect(await store.mergeRounds(file)).toBe(0);
    expect((await store.listRounds()).map(({ id }) => id)).toEqual(["a", "b", "c"]);
    expect((await store.readSummary()).rounds).toBe(3);
  });

  it("adds a round id repeated inside one file once", async () => {
    const store = createLabStore(deps());

    expect(await store.mergeRounds([round({ id: "a", endedAt: 1 }), round({ id: "a", endedAt: 1 }), round({ id: "b", endedAt: 2 })])).toBe(2);
    expect((await store.listRounds()).map(({ id }) => id)).toEqual(["a", "b"]);
    expect((await store.readSummary()).rounds).toBe(2);
  });

  it("restores an export after a clear exactly", async () => {
    const store = createLabStore(deps());
    await store.addRound(round({ id: "a", endedAt: 1 }));
    await store.addRound(round({ id: "b", endedAt: 2, localDay: "2026-10-08" }));
    const rounds = await store.listRounds();
    const summary = await store.readSummary();

    await store.clear();
    expect(await store.listRounds()).toEqual([]);
    await store.mergeRounds(rounds);

    expect(await store.listRounds()).toEqual(rounds);
    expect(await store.readSummary()).toEqual(summary);
  });

  it("rebuilds a damaged summary from the log", async () => {
    const storage = memoryStorage();
    const store = createLabStore(deps({ localStorage: storage }));
    await store.addRound(round({ id: "a" }));
    storage.setItem("memory-chess-lab-summary", "{not json");

    expect(await store.readSummary()).toMatchObject({ rounds: 1 });
  });

  it("rebuilds a summary written in an older shape from the log", async () => {
    const storage = memoryStorage();
    const store = createLabStore(deps({ localStorage: storage }));
    await store.addRound(round({ id: "a", endedAt: 1 }));
    await store.addRound(round({ id: "b", endedAt: 2, source: "calibration" }));
    const old = { ...JSON.parse(storage.getItem("memory-chess-lab-summary") as string), v: 1, rounds: 99 };
    storage.setItem("memory-chess-lab-summary", JSON.stringify(old));

    const summary = await store.readSummary();

    expect(summary).toMatchObject({ v: 2, rounds: 2 });
    expect(Object.keys(summary.bests)).toEqual(["game:4x10", "calibration:4x10"]);
  });

  it(`drops the oldest rounds past ${ROUND_CAP}`, async () => {
    const store = createLabStore(deps());
    const many = Array.from({ length: ROUND_CAP + 2 }, (_, index) => round({ id: `r${index}`, endedAt: index }));
    await store.mergeRounds(many);

    const kept = await store.listRounds();
    expect(kept.length).toBe(ROUND_CAP);
    expect(kept[0].id).toBe("r2");
    expect((await store.readSummary()).rounds).toBe(ROUND_CAP + 2);
  }, 30000);

  it("counts no round twice when an old backup is imported after the oldest were evicted", async () => {
    const store = createLabStore(deps());
    await store.mergeRounds(Array.from({ length: ROUND_CAP }, (_, index) => round({ id: `r${index}`, endedAt: index })));
    const backup = await store.listRounds();
    for (let index = 0; index < 3; index++) await store.addRound(round({ id: `new${index}`, endedAt: ROUND_CAP + index }));
    const before = await store.readSummary();

    expect(await store.mergeRounds(backup)).toBe(0);
    expect(await store.mergeRounds(backup)).toBe(0);
    expect(before).toMatchObject({ rounds: ROUND_CAP + 3, bests: { "game:4x10": { rounds: ROUND_CAP + 3 } } });
    expect(await store.readSummary()).toEqual(before);
    expect((await store.listRounds())[0].id).toBe("r3");
  }, 30000);

  it("restores the lifetime summary of a player past the cap into an empty record, once", async () => {
    const source = createLabStore(deps());
    await source.mergeRounds(longHistory());
    const file = await exportFile(source);
    const target = createLabStore(deps());

    expect(await importFile(target, file)).toBe(ROUND_CAP);
    const restored = await target.readSummary();
    expect(restored).toMatchObject({
      rounds: ROUND_CAP + 3,
      days: ["2026-01-01", "2026-01-02", "2026-01-03", "2026-10-07"],
      bests: { "game:4x10": { rounds: ROUND_CAP + 2, accuracy: 100 }, "calibration:4x10": { rounds: 1 } },
      typeShown: { k: 2 * (ROUND_CAP + 3), q: ROUND_CAP + 3, n: ROUND_CAP + 3 },
      typeMissed: { q: 1 },
      evictedThrough: 3,
    });
    expect(restored.squareShown[27]).toBe(ROUND_CAP + 3);
    expect(restored.squareMissed[27]).toBe(1);
    expect(await target.readSummary()).toEqual(await source.readSummary());
    expect((await target.listRounds()).map(({ id }) => id)).toEqual((await source.listRounds()).map(({ id }) => id));

    expect(await importFile(target, file)).toBe(0);
    expect(await target.readSummary()).toEqual(restored);
  }, 60000);

  it("merges only the rounds, never the file's totals, into a record that already has rounds", async () => {
    const source = createLabStore(deps());
    await source.mergeRounds(longHistory());
    const file = await exportFile(source);
    const target = createLabStore(deps());
    await target.addRound(round({ id: "own", endedAt: 2, localDay: "2026-09-01" }));

    expect(await importFile(target, file)).toBe(ROUND_CAP);
    expect(await target.readSummary()).toMatchObject({
      rounds: ROUND_CAP + 1,
      days: ["2026-09-01", "2026-10-07"],
      typeMissed: {},
    });
  }, 60000);

  it(`asks the browser to keep the record after ${PERSIST_AFTER_ROUNDS} rounds, once`, async () => {
    const setup = deps();
    const store = createLabStore(setup);
    for (let index = 0; index < PERSIST_AFTER_ROUNDS + 2; index++) {
      await store.addRound(round({ id: `p${index}`, endedAt: index }));
      expect(setup.persist).toHaveBeenCalledTimes(index + 1 >= PERSIST_AFTER_ROUNDS ? 1 : 0);
    }
  });

  it("reports itself unavailable and saves nothing without IndexedDB", async () => {
    const store = createLabStore(deps({ indexedDB: undefined }));

    expect(await store.isAvailable()).toBe(false);
    expect(await store.addRound(round())).toBe(false);
    expect(await store.listRounds()).toEqual([]);
  });

  it("keeps saving rounds when only local storage throws, rebuilding the summary from the log", async () => {
    const throwing = { ...memoryStorage(), setItem: () => { throw new Error("QuotaExceededError"); } } as Storage;
    const store = createLabStore(deps({ localStorage: throwing }));

    expect(await store.isAvailable()).toBe(true);
    expect(await store.addRound(round({ id: "a", endedAt: 1 }))).toBe(true);
    expect(await store.addRound(round({ id: "b", endedAt: 2, localDay: "2026-10-08" }))).toBe(true);
    expect(await store.readSummary()).toMatchObject({ rounds: 2, days: ["2026-10-07", "2026-10-08"] });
  });

  it("reopens after the browser closes the connection", async () => {
    const factory = new IDBFactory();
    const opened: IDBDatabase[] = [];
    const spying = {
      open: (name: string, version?: number) => {
        const req = factory.open(name, version);
        req.addEventListener("success", () => opened.push(req.result));
        return req;
      },
    } as unknown as IDBFactory;
    const store = createLabStore(deps({ indexedDB: spying }));
    await store.addRound(round({ id: "a", endedAt: 1 }));

    forceCloseDatabase(opened[0] as never);

    expect(await store.addRound(round({ id: "b", endedAt: 2 }))).toBe(true);
    expect((await store.listRounds()).map(({ id }) => id)).toEqual(["a", "b"]);
    expect(opened.length).toBe(2);
  });

  it("lets another tab delete the database instead of blocking it, then reopens", async () => {
    const factory = new IDBFactory();
    const store = createLabStore(deps({ indexedDB: factory }));
    await store.addRound(round({ id: "a", endedAt: 1 }));

    const outcome = await new Promise<string>((resolve) => {
      const req = factory.deleteDatabase("memory-chess-lab");
      req.onsuccess = () => resolve("deleted");
      req.onblocked = () => resolve("blocked");
    });

    expect(outcome).toBe("deleted");
    expect(await store.addRound(round({ id: "b", endedAt: 2 }))).toBe(true);
    expect((await store.listRounds()).map(({ id }) => id)).toEqual(["b"]);
  });

  it("counts both rounds when two writers save at the same moment", async () => {
    const shared = { indexedDB: new IDBFactory(), localStorage: memoryStorage(), locks: queuedLocks() };
    const tabA = createLabStore(deps(shared));
    const tabB = createLabStore(deps(shared));

    await Promise.all([
      tabA.addRound(round({ id: "a", endedAt: 1 })),
      tabB.addRound(round({ id: "b", endedAt: 2, source: "calibration", localDay: "2026-10-08" })),
    ]);

    expect((await tabA.listRounds()).length).toBe(2);
    expect(await tabB.readSummary()).toMatchObject({
      rounds: 2,
      days: ["2026-10-07", "2026-10-08"],
      bests: { "game:4x10": { rounds: 1 }, "calibration:4x10": { rounds: 1 } },
      typeShown: { k: 4, q: 2, n: 2 },
    });
  });

  it("remembers when the record was last backed up", () => {
    const store = createLabStore(deps());
    expect(store.readLastBackup()).toBeNull();
    store.markBackedUp(1700000000000);
    expect(store.readLastBackup()).toBe(1700000000000);
  });

  describe("placements", () => {
    const played = (count: number, from = 1) =>
      Array.from({ length: count }, (_, index) => roundV2({ id: `p${from + index}`, endedAt: from + index }));
    const withPlacements = async (store: ReturnType<typeof createLabStore>) =>
      (await store.listRounds()).filter((record) => "placements" in record).map(({ id }) => id);

    it("drops the placements of the round that falls out of the newest 500 when a round is saved, and keeps its other facts", async () => {
      const store = createLabStore(deps());
      const history = played(PLACEMENT_KEEP);
      await store.mergeRounds(history);

      await store.addRound(roundV2({ id: "latest", endedAt: 10_000 }));
      const rounds = await store.listRounds();

      expect(rounds).toHaveLength(PLACEMENT_KEEP + 1);
      expect(rounds[0]).toEqual(withoutPlacements(history[0]));
      expect(rounds[0]).toMatchObject({ v: 2, positionId: "0a6c3bd6ea5bcc", startSource: "home_quick", tzOffsetMin: -480 });
      expect(await withPlacements(store)).toEqual([...history.slice(1).map(({ id }) => id), "latest"]);
    });

    it("saves a late round older than the newest 500 without its placements", async () => {
      const store = createLabStore(deps());
      await store.mergeRounds(played(PLACEMENT_KEEP, 100));

      await store.addRound(roundV2({ id: "late", endedAt: 1 }));

      expect((await store.listRounds())[0]).toEqual(withoutPlacements(roundV2({ id: "late", endedAt: 1 })));
      expect(await withPlacements(store)).toHaveLength(PLACEMENT_KEEP);
    });

    it("keeps placements on the newest 500 after an import merges into rounds that had them", async () => {
      const store = createLabStore(deps());
      await store.mergeRounds(played(400, 1));

      expect(await store.mergeRounds(played(300, 401))).toBe(300);

      expect(await withPlacements(store)).toEqual(played(500, 201).map(({ id }) => id));
      expect(await store.listRounds()).toHaveLength(700);
    });

    it("leaves version 1 rounds as they were", async () => {
      const store = createLabStore(deps());
      const old = round({ id: "v1", endedAt: 0 });
      await store.mergeRounds([old, ...played(PLACEMENT_KEEP)]);

      expect((await store.listRounds())[0]).toEqual(old);
    });
  });
});
