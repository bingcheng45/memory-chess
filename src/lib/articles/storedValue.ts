export type StorageName = "localStorage" | "sessionStorage";

export type StoredShape<T> = {
  readonly empty: T;
  readonly parse: (stored: unknown) => T;
  readonly serialize: (value: T) => unknown;
};

export type StoredValue<T> = {
  readonly read: () => T;
  readonly write: (value: T) => void;
  readonly subscribe: (onChange: () => void) => () => void;
};

export function createStoredValue<T extends object>(
  storageName: StorageName,
  key: string,
  { empty, parse, serialize }: StoredShape<T>,
): StoredValue<T> {
  const listeners = new Set<() => void>();
  let unsaved: T | null = null;

  function read(): T {
    if (unsaved !== null) return unsaved;
    if (typeof window === "undefined") return empty;

    try {
      const raw = window[storageName].getItem(key);
      return raw === null ? empty : parse(JSON.parse(raw));
    } catch {
      return empty;
    }
  }

  function write(value: T): void {
    if (typeof window === "undefined") return;

    try {
      window[storageName].setItem(key, JSON.stringify(serialize(value)));
      unsaved = null;
    } catch {
      unsaved = value;
    }
    listeners.forEach((notify) => notify());
  }

  function subscribe(onChange: () => void): () => void {
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === key) onChange();
    };
    listeners.add(onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(onChange);
      window.removeEventListener("storage", onStorage);
    };
  }

  return { read, write, subscribe };
}
