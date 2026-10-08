/**
 * The browser's IndexedDB, or undefined when it has none or blocks it. Kept apart from the store so /game can ask
 * before a round ends without loading the store's code. A factory here can still fail to open or to write.
 */
export function browserIndexedDB(): IDBFactory | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return window.indexedDB ?? undefined;
  } catch {
    return undefined;
  }
}
