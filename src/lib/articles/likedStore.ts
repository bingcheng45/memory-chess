import { isCount, isRecord } from "@/lib/articles/stats";
import { createStoredValue, type StoredShape } from "@/lib/articles/storedValue";

export const LIKED_STORAGE_KEY = "memory-chess:article-likes:v1";

export const NOT_LIKED = 0;

const OWN_LIKE = 1;
const SHAPE_VERSION = 2;

// Each liked slug with the like count the visitor saw when they liked it. The
// article pages are up to five minutes old, so without the count a reload
// right after a like shows the older, lower number under a pressed heart.
type LikesSeen = ReadonlyMap<string, number>;

const NO_LIKES: LikesSeen = new Map();

function isLikesSeen(entry: [string, unknown]): entry is [string, number] {
  return isCount(entry[1]) && entry[1] >= OWN_LIKE;
}

function parseLikesSeen(stored: unknown): LikesSeen {
  // Version 1 was a bare list of liked slugs.
  if (Array.isArray(stored)) {
    return stored.every((slug) => typeof slug === "string")
      ? new Map(stored.map((slug) => [slug, OWN_LIKE]))
      : NO_LIKES;
  }
  if (!isRecord(stored) || stored.version !== SHAPE_VERSION || !isRecord(stored.likes)) return NO_LIKES;

  return new Map(Object.entries(stored.likes).filter(isLikesSeen));
}

const LIKES_SEEN: StoredShape<LikesSeen> = {
  empty: NO_LIKES,
  parse: parseLikesSeen,
  serialize: (likes) => ({ version: SHAPE_VERSION, likes: Object.fromEntries(likes) }),
};

const likes = createStoredValue("localStorage", LIKED_STORAGE_KEY, LIKES_SEEN);

export const likedStore = {
  likesSeen: (slug: string): number => likes.read().get(slug) ?? NOT_LIKED,
  like: (slug: string, likesSeen: number): void =>
    likes.write(new Map([...likes.read(), [slug, Math.max(likesSeen, OWN_LIKE)]])),
  unlike: (slug: string): void => likes.write(new Map([...likes.read()].filter(([kept]) => kept !== slug))),
  subscribe: likes.subscribe,
};
