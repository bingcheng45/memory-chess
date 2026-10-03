export type SlugSetStore = {
  readonly has: (slug: string) => boolean;
  readonly add: (slug: string) => void;
  readonly remove: (slug: string) => void;
  readonly subscribe: (onChange: () => void) => () => void;
};

type StorageName = "localStorage" | "sessionStorage";

const NO_SLUGS: ReadonlySet<string> = new Set();

function parseSlugs(raw: string | null): ReadonlySet<string> {
  if (raw === null) return NO_SLUGS;

  const stored: unknown = JSON.parse(raw);
  return Array.isArray(stored) && stored.every((slug) => typeof slug === "string")
    ? new Set(stored)
    : NO_SLUGS;
}

export function createSlugSetStore(storageName: StorageName, key: string): SlugSetStore {
  const listeners = new Set<() => void>();
  // A private window can answer reads and still refuse every write, so a set that
  // could not be saved has to win over what the storage says until a write lands.
  let unsaved: ReadonlySet<string> | null = null;

  function read(): ReadonlySet<string> {
    if (unsaved !== null) return unsaved;
    if (typeof window === "undefined") return NO_SLUGS;

    try {
      return parseSlugs(window[storageName].getItem(key));
    } catch {
      return NO_SLUGS;
    }
  }

  function write(slugs: ReadonlySet<string>): void {
    if (typeof window === "undefined") return;

    try {
      window[storageName].setItem(key, JSON.stringify([...slugs]));
      unsaved = null;
    } catch {
      unsaved = slugs;
    }
    listeners.forEach((notify) => notify());
  }

  return {
    has: (slug) => read().has(slug),
    add: (slug) => write(new Set([...read(), slug])),
    remove: (slug) => write(new Set([...read()].filter((kept) => kept !== slug))),
    subscribe: (onChange) => {
      const onStorage = (event: StorageEvent) => {
        if (event.key === null || event.key === key) onChange();
      };
      listeners.add(onChange);
      window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(onChange);
        window.removeEventListener("storage", onStorage);
      };
    },
  };
}
