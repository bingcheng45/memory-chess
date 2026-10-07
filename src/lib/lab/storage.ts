import type { RoundRecordV1 } from "./record";
import { addToSummary, parseSummary, summarize, type LabSummary } from "./summary";

const DB_NAME = "memory-chess-lab";
const DB_VERSION = 1;
const STORE = "rounds";
const BY_END = "endedAt";
const SUMMARY_KEY = "memory-chess-lab-summary";
const BACKUP_KEY = "memory-chess-lab-last-backup";
const PERSIST_ASKED_KEY = "memory-chess-lab-persist-asked";

export const ROUND_CAP = 5000;
/** Ask the browser not to evict the record only once the player has some history. */
export const PERSIST_AFTER_ROUNDS = 3;

export interface LabStoreDeps {
  readonly indexedDB: IDBFactory | undefined;
  readonly localStorage: Storage | undefined;
  readonly storageManager: StorageManager | undefined;
}

export interface LabStore {
  /** Whether rounds can be saved. Without local storage the summary is rebuilt from the round log instead. */
  isAvailable(): Promise<boolean>;
  /** Writes one round; a round whose id is already stored is left alone. Resolves false if nothing could be saved. */
  addRound(record: RoundRecordV1): Promise<boolean>;
  listRounds(): Promise<RoundRecordV1[]>;
  /** Adds the rounds that are new to this record and returns how many that was, so a second import adds 0. */
  mergeRounds(records: readonly RoundRecordV1[]): Promise<number>;
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

  function storedSummary(): LabSummary | null {
    try {
      return parseSummary(JSON.parse(readText(SUMMARY_KEY) ?? "null"));
    } catch {
      return null;
    }
  }

  async function allRounds(db: IDBDatabase): Promise<RoundRecordV1[]> {
    return request(db.transaction(STORE).objectStore(STORE).index(BY_END).getAll() as IDBRequest<RoundRecordV1[]>);
  }

  async function insertNew(db: IDBDatabase, records: readonly RoundRecordV1[]): Promise<RoundRecordV1[]> {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    // One read of at most ROUND_CAP keys, rather than a request per incoming round.
    const seen = new Set(await request(store.getAllKeys()));
    const fresh = records.filter(({ id }) => {
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
    fresh.forEach((record) => store.add(record));
    await done(tx);
    return fresh;
  }

  /** Returns the endedAt of the newest round it evicted, or null if the log was within the cap. */
  async function evictOverCap(db: IDBDatabase): Promise<number | null> {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const excess = (await request(store.count())) - ROUND_CAP;
    const oldest = excess > 0 ? await request(store.index(BY_END).getAll(null, excess) as IDBRequest<RoundRecordV1[]>) : [];
    oldest.forEach(({ id }) => store.delete(id));
    await done(tx);
    return oldest.at(-1)?.endedAt ?? null;
  }

  /**
   * The summary counts every round in the log plus every round evicted from it,
   * each once. Evicted ids are gone, so a round at or before the eviction
   * watermark may already be counted and is never folded in again.
   */
  async function ingest(records: readonly RoundRecordV1[]): Promise<number> {
    const db = await open();
    const before = storedSummary() ?? summarize(await allRounds(db));
    const watermark = before.evictedThrough;
    const added = await insertNew(db, watermark === null ? records : records.filter(({ endedAt }) => endedAt > watermark));
    if (added.length === 0) return 0;
    const evicted = await evictOverCap(db);
    const counted = [...added].sort((a, b) => a.endedAt - b.endedAt).reduce(addToSummary, before);
    // Every round in the log is newer than the watermark, so a fresh eviction only moves it forward.
    await saveSummary({ ...counted, evictedThrough: evicted ?? watermark });
    return added.length;
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

  async function saveSummary(next: LabSummary): Promise<void> {
    writeText(SUMMARY_KEY, JSON.stringify(next));
    await requestPersistence(next.rounds);
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

    async readSummary() {
      const stored = storedSummary();
      if (stored) return stored;
      const rebuilt = summarize(await this.listRounds());
      if (rebuilt.rounds > 0) writeText(SUMMARY_KEY, JSON.stringify(rebuilt));
      return rebuilt;
    },

    async clear() {
      const db = await open();
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).clear();
      await done(tx);
      try {
        deps.localStorage?.removeItem(SUMMARY_KEY);
        deps.localStorage?.removeItem(BACKUP_KEY);
      } catch {
        // Nothing else to undo; the log itself is already empty.
      }
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

/** The store for this browser, or null during server rendering. */
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
  });
  return browserStore;
}
