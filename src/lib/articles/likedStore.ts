import { isCount, isRecord } from "@/lib/articles/stats";
import { createStoredValue, type StoredShape } from "@/lib/articles/storedValue";

export const LIKED_STORAGE_KEY = "memory-chess:article-likes:v1";

export const NOT_LIKED = 0;

const OWN_LIKE = 1;
const SHAPE_VERSION = 2;

type LikesSeenBySlug = ReadonlyMap<string, number>;

const NO_LIKES: LikesSeenBySlug = new Map();

function isLikesSeen(entry: [string, unknown]): entry is [string, number] {
  return isCount(entry[1]) && entry[1] >= OWN_LIKE;
}

function fromVersion1ListOfLikedSlugs(slugs: readonly unknown[]): LikesSeenBySlug {
  return slugs.every((slug) => typeof slug === "string") ? new Map(slugs.map((slug) => [slug, OWN_LIKE])) : NO_LIKES;
}

function fromVersion2(stored: unknown): LikesSeenBySlug {
  if (!isRecord(stored) || stored.version !== SHAPE_VERSION || !isRecord(stored.likes)) return NO_LIKES;

  return new Map(Object.entries(stored.likes).filter(isLikesSeen));
}

const LIKES_SEEN: StoredShape<LikesSeenBySlug> = {
  empty: NO_LIKES,
  parse: (stored) => (Array.isArray(stored) ? fromVersion1ListOfLikedSlugs(stored) : fromVersion2(stored)),
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
