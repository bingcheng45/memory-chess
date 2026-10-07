import { withoutPlacements, type RoundRecord } from "./record";
import { addToSummary, parseSummary, summarize, type LabSummary } from "./summary";

const DB_NAME = "memory-chess-lab";
const DB_VERSION = 1;
const STORE = "rounds";
const BY_END = "endedAt";
export const SUMMARY_KEY = "memory-chess-lab-summary";
const BACKUP_KEY = "memory-chess-lab-last-backup";
const PERSIST_ASKED_KEY = "memory-chess-lab-persist-asked";
const SUMMARY_LOCK = "memory-chess-lab";

export const ROUND_CAP = 5000;
/** Placements are about half a round's bytes, so only the newest rounds keep them. */
export const PLACEMENT_KEEP = 500;
export const PERSIST_AFTER_ROUNDS = 3;

export interface LabStoreDeps {
  readonly indexedDB: IDBFactory | undefined;
  readonly localStorage: Storage | undefined;
  readonly storageManager: StorageManager | undefined;
  readonly locks: LockManager | undefined;
}

export interface LabStore {
  isAvailable(): Promise<boolean>;
  /** Writes one round; a round whose id is already stored is left alone. Resolves false if nothing could be saved. */
  addRound(record: RoundRecord): Promise<boolean>;
  listRounds(): Promise<RoundRecord[]>;
  /** Adds the rounds that are new to this record and returns how many that was, so a second import adds 0. */
  mergeRounds(records: readonly RoundRecord[]): Promise<number>;
  /**
   * Into an empty record only: keeps the rounds and takes the exported summary
   * as the lifetime totals. Resolves null, changing nothing, if the record
   * already has rounds; merge those with mergeRounds instead.
   */
  restore(records: readonly RoundRecord[], summary: LabSummary): Promise<number | null>;
  readSummary(): Promise<LabSummary>;
  clear(): Promise<void>;
  readLastBackup(): number | null;
  markBackedUp(at: number): void;
}

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function done(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

/**
 * Before a write no round past the newest PLACEMENT_KEEP has placements. A
 * saved round newer than all the others pushes exactly one round past that
 * line, so only that one is read; an import or a late round walks them all.
 */
function keepPlacementsOnNewest(index: IDBIndex, fresh: readonly RoundRecord[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = index.openCursor(null, "prev");
    let left: number | null = null;
    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor || left === 0) return resolve();
      if (left === null) {
        left = fresh.length === 1 && cursor.primaryKey === fresh[0].id ? 1 : Infinity;
        return cursor.advance(PLACEMENT_KEEP);
      }
      const record = cursor.value as RoundRecord;
      const trimmed = withoutPlacements(record);
      if (trimmed !== record) cursor.update(trimmed);
      left -= 1;
      cursor.continue();
    };
    req.onerror = () => reject(req.error);
  });
}

export function createLabStore(deps: LabStoreDeps): LabStore {
  let opening: Promise<IDBDatabase> | null = null;

  function open(): Promise<IDBDatabase> {
    if (!deps.indexedDB) return Promise.reject(new Error("IndexedDB is unavailable"));
    opening ??= new Promise<IDBDatabase>((resolve, reject) => {
      const req = (deps.indexedDB as IDBFactory).open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const store = req.result.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex(BY_END, "endedAt");
      };
      req.onsuccess = () => {
        const db = req.result;
        // Another tab deleting or upgrading the database, or the browser closing it, must not leave a dead handle cached.
        db.onclose = () => {
          opening = null;
        };
        db.onversionchange = () => {
          db.close();
          opening = null;
        };
        resolve(db);
      };
      req.onerror = () => reject(req.error);
      req.onblocked = () => reject(new Error("IndexedDB open blocked"));
    }).catch((error: unknown) => {
      opening = null;
      throw error;
    });
    return opening;
  }

  function readText(key: string): string | null {
    try {
      return deps.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }

  function writeText(key: string, value: string): boolean {
    try {
      if (!deps.localStorage) return false;
      deps.localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Every read-modify-write of the summary holds one lock shared by all tabs,
   * so no writer folds its rounds into a summary another writer has since
   * replaced. Without the Web Locks API writes run as they come, as before.
   */
  function exclusive<T>(work: () => Promise<T>): Promise<T> {
    return deps.locks ? deps.locks.request(SUMMARY_LOCK, work) : work();
  }

  function storedSummary(): LabSummary | null {
    try {
      return parseSummary(JSON.parse(readText(SUMMARY_KEY) ?? "null"));
    } catch {
      return null;
    }
  }

  async function allRounds(db: IDBDatabase): Promise<RoundRecord[]> {
    return request(db.transaction(STORE).objectStore(STORE).index(BY_END).getAll() as IDBRequest<RoundRecord[]>);
  }

  async function insertNew(
    db: IDBDatabase,
    records: readonly RoundRecord[],
  ): Promise<{ fresh: RoundRecord[]; evicted: number | null }> {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    // A saved round looks up its own id; an import reads at most ROUND_CAP keys once.
    const known =
      records.length === 1
        ? [await request(store.getKey(records[0].id))].filter((key) => key !== undefined)
        : await request(store.getAllKeys());
    const seen = new Set<IDBValidKey>(known);
    const fresh = records.filter(({ id }) => {
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
    fresh.forEach((record) => store.add(record));
    const held = fresh.length === 0 ? 0 : await request(store.count());
    const excess = held - ROUND_CAP;
    const oldest = excess > 0 ? await request(store.index(BY_END).getAll(null, excess) as IDBRequest<RoundRecord[]>) : [];
    oldest.forEach(({ id }) => store.delete(id));
    if (fresh.length > 0 && held > PLACEMENT_KEEP) await keepPlacementsOnNewest(store.index(BY_END), fresh);
    await done(tx);
    return { fresh, evicted: oldest.at(-1)?.endedAt ?? null };
  }

  const afterWatermark = (records: readonly RoundRecord[], watermark: number | null) =>
    watermark === null ? records : records.filter(({ endedAt }) => endedAt > watermark);

  /**
   * The summary counts every round in the log plus every round evicted from it,
   * each once. Evicted ids are gone, so a round at or before the eviction
   * watermark may already be counted and is never folded in again.
   */
  async function ingest(records: readonly RoundRecord[]): Promise<number> {
    const db = await open();
    const saved = await exclusive(async () => {
      const before = storedSummary() ?? summarize(await allRounds(db));
      const watermark = before.evictedThrough;
      const { fresh: added, evicted } = await insertNew(db, afterWatermark(records, watermark));
      if (added.length === 0) return null;
      const counted = [...added].sort((a, b) => a.endedAt - b.endedAt).reduce(addToSummary, before);
      // Every round in the log is newer than the watermark, so a fresh eviction only moves it forward.
      const next = { ...counted, evictedThrough: evicted ?? watermark };
      writeText(SUMMARY_KEY, JSON.stringify(next));
      return { added: added.length, rounds: next.rounds };
    });
    if (!saved) return 0;
    // Outside the lock: a browser may hold this promise open on a permission prompt.
    await requestPersistence(saved.rounds);
    return saved.added;
  }

  /** An exported summary already counts the rounds exported with it, so they go into the log without being added again. */
  async function restore(records: readonly RoundRecord[], summary: LabSummary): Promise<number | null> {
    const db = await open();
    const saved = await exclusive(async () => {
      const held = await request(db.transaction(STORE).objectStore(STORE).count());
      if (held > 0 || (storedSummary()?.rounds ?? 0) > 0) return null;
      const { fresh, evicted } = await insertNew(db, afterWatermark(records, summary.evictedThrough));
      const next = { ...summary, evictedThrough: evicted ?? summary.evictedThrough };
      writeText(SUMMARY_KEY, JSON.stringify(next));
      return { added: fresh.length, rounds: next.rounds };
    });
    if (!saved) return null;
    await requestPersistence(saved.rounds);
    return saved.added;
  }

  async function requestPersistence(rounds: number): Promise<void> {
    if (rounds < PERSIST_AFTER_ROUNDS || readText(PERSIST_ASKED_KEY) || !deps.storageManager?.persist) return;
    writeText(PERSIST_ASKED_KEY, "1");
    try {
      await deps.storageManager.persist();
    } catch {
      // The browser decides by its own heuristics; a refusal leaves storage best-effort, as before.
    }
  }

  return {
    async isAvailable() {
      try {
        await open();
        return true;
      } catch {
        return false;
      }
    },

    async addRound(record) {
      try {
        await ingest([record]);
        return true;
      } catch {
        return false;
      }
    },

    async listRounds() {
      try {
        return await allRounds(await open());
      } catch {
        return [];
      }
    },

    mergeRounds: ingest,

    restore,

    async readSummary() {
      return (
        storedSummary() ??
        exclusive(async () => {
          const stored = storedSummary();
          if (stored) return stored;
          const rebuilt = summarize(await this.listRounds());
          if (rebuilt.rounds > 0) writeText(SUMMARY_KEY, JSON.stringify(rebuilt));
          return rebuilt;
        })
      );
    },

    async clear() {
      const db = await open();
      await exclusive(async () => {
        const tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).clear();
        await done(tx);
        try {
          deps.localStorage?.removeItem(SUMMARY_KEY);
          deps.localStorage?.removeItem(BACKUP_KEY);
        } catch {
          // Nothing else to undo; the log itself is already empty.
        }
      });
    },

    readLastBackup() {
      const at = Number(readText(BACKUP_KEY));
      return Number.isFinite(at) && at > 0 ? at : null;
    },

    markBackedUp(at) {
      writeText(BACKUP_KEY, String(at));
    },
  };
}

let browserStore: LabStore | null = null;

export function labStore(): LabStore | null {
  if (typeof window === "undefined") return null;
  browserStore ??= createLabStore({
    indexedDB: (() => {
      try {
        return window.indexedDB;
      } catch {
        return undefined;
      }
    })(),
    localStorage: (() => {
      try {
        return window.localStorage;
      } catch {
        return undefined;
      }
    })(),
    storageManager: typeof navigator === "undefined" ? undefined : navigator.storage,
    locks: typeof navigator === "undefined" ? undefined : navigator.locks,
  });
  return browserStore;
}
