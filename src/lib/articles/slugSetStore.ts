import { createStoredValue, type StorageName, type StoredShape } from "@/lib/articles/storedValue";

export type SlugSetStore = {
  readonly has: (slug: string) => boolean;
  readonly add: (slug: string) => void;
  readonly remove: (slug: string) => void;
  readonly subscribe: (onChange: () => void) => () => void;
};

const NO_SLUGS: ReadonlySet<string> = new Set();

const SLUG_SET: StoredShape<ReadonlySet<string>> = {
  empty: NO_SLUGS,
  parse: (stored) =>
    Array.isArray(stored) && stored.every((slug) => typeof slug === "string") ? new Set(stored) : NO_SLUGS,
  serialize: (slugs) => [...slugs],
};

export function createSlugSetStore(storageName: StorageName, key: string): SlugSetStore {
  const slugs = createStoredValue(storageName, key, SLUG_SET);

  return {
    has: (slug) => slugs.read().has(slug),
    add: (slug) => slugs.write(new Set([...slugs.read(), slug])),
    remove: (slug) => slugs.write(new Set([...slugs.read()].filter((kept) => kept !== slug))),
    subscribe: slugs.subscribe,
  };
}
