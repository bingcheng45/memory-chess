import { LIKED_STORAGE_KEY, likedStore } from "@/lib/articles/likedStore";
import { VIEWED_STORAGE_KEY, viewedStore } from "@/lib/articles/viewedStore";

const SLUG = "alder-fixture";
const OTHER = "birch-fixture";

const full = () => {
  throw new DOMException("The quota has been exceeded.", "QuotaExceededError");
};
const blocked = () => {
  throw new DOMException("The operation is insecure.", "SecurityError");
};
const stored = () => JSON.parse(window.localStorage.getItem(LIKED_STORAGE_KEY) ?? "null");

afterEach(() => {
  jest.restoreAllMocks();
  likedStore.unlike(SLUG);
  likedStore.unlike(OTHER);
  viewedStore.remove(SLUG);
  window.localStorage.clear();
  window.sessionStorage.clear();
});

describe("likedStore", () => {
  it("sees no like before one is made", () => {
    expect(likedStore.likesSeen(SLUG)).toBe(0);
    expect(stored()).toBeNull();
  });

  it("keeps a like and the count shown with it in localStorage, so they outlive the tab", () => {
    likedStore.like(SLUG, 188);

    expect(LIKED_STORAGE_KEY).toBe("memory-chess:article-likes:v1");
    expect(stored()).toEqual({ version: 2, likes: { [SLUG]: 188 } });
    expect(window.sessionStorage).toHaveLength(0);
    expect(likedStore.likesSeen(SLUG)).toBe(188);
    expect(likedStore.likesSeen(OTHER)).toBe(0);
  });

  it("replaces the count when the same article is liked again with a newer one", () => {
    likedStore.like(SLUG, 188);
    likedStore.like(SLUG, 191);

    expect(stored()).toEqual({ version: 2, likes: { [SLUG]: 191 } });
  });

  it("counts the visitor's own like when the count that came with it is zero", () => {
    likedStore.like(SLUG, 0);

    expect(likedStore.likesSeen(SLUG)).toBe(1);
  });

  it("forgets the like and its count on an unlike, and keeps the other likes", () => {
    likedStore.like(SLUG, 188);
    likedStore.like(OTHER, 7);

    likedStore.unlike(SLUG);

    expect(likedStore.likesSeen(SLUG)).toBe(0);
    expect(stored()).toEqual({ version: 2, likes: { [OTHER]: 7 } });
  });

  it("reads the older shape, a bare list of slugs, as the visitor's own like with no count beside it", () => {
    window.localStorage.setItem(LIKED_STORAGE_KEY, JSON.stringify([SLUG]));

    expect(likedStore.likesSeen(SLUG)).toBe(1);
    expect(likedStore.likesSeen(OTHER)).toBe(0);
  });

  it("keeps the likes of the older shape when it writes the new one over it", () => {
    window.localStorage.setItem(LIKED_STORAGE_KEY, JSON.stringify([SLUG]));

    likedStore.like(OTHER, 7);

    expect(stored()).toEqual({ version: 2, likes: { [SLUG]: 1, [OTHER]: 7 } });
  });

  it.each([
    ["text that is not JSON", "{not json"],
    ["a version it does not know", JSON.stringify({ version: 3, likes: { [SLUG]: 188 } })],
    ["no version", JSON.stringify({ likes: { [SLUG]: 188 } })],
    ["likes that are a list", JSON.stringify({ version: 2, likes: [SLUG] })],
    ["a list holding a number", JSON.stringify([SLUG, 7])],
    ["a bare string", JSON.stringify(SLUG)],
    ["null", "null"],
  ])("reads %s as no likes", (_, raw) => {
    window.localStorage.setItem(LIKED_STORAGE_KEY, raw);

    expect(likedStore.likesSeen(SLUG)).toBe(0);
  });

  it.each([
    ["text", "188"],
    ["zero", 0],
    ["a negative number", -3],
    ["a fraction", 1.5],
    ["null", null],
  ])("drops a like whose stored count is %s, and keeps the sound ones", (_, count) => {
    window.localStorage.setItem(
      LIKED_STORAGE_KEY,
      JSON.stringify({ version: 2, likes: { [SLUG]: count, [OTHER]: 7 } }),
    );

    expect(likedStore.likesSeen(SLUG)).toBe(0);
    expect(likedStore.likesSeen(OTHER)).toBe(7);
  });

  it("likes and unlikes within the page when the storage refuses every write", () => {
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(full);

    expect(() => likedStore.like(SLUG, 188)).not.toThrow();
    expect(likedStore.likesSeen(SLUG)).toBe(188);

    expect(() => likedStore.unlike(SLUG)).not.toThrow();
    expect(likedStore.likesSeen(SLUG)).toBe(0);
  });

  it("sees no like, and does not throw, when the storage refuses every read", () => {
    window.localStorage.setItem(LIKED_STORAGE_KEY, JSON.stringify({ version: 2, likes: { [SLUG]: 188 } }));
    jest.spyOn(Storage.prototype, "getItem").mockImplementation(blocked);

    expect(likedStore.likesSeen(SLUG)).toBe(0);
  });

  it("tells a subscriber about a like, an unlike and a change in another tab, until it leaves", () => {
    const onChange = jest.fn();
    const leave = likedStore.subscribe(onChange);

    likedStore.like(SLUG, 188);
    likedStore.unlike(SLUG);
    window.dispatchEvent(new StorageEvent("storage", { key: LIKED_STORAGE_KEY }));
    window.dispatchEvent(new StorageEvent("storage", { key: "some-other-key" }));
    expect(onChange).toHaveBeenCalledTimes(3);

    leave();
    likedStore.like(SLUG, 188);
    expect(onChange).toHaveBeenCalledTimes(3);
  });

  it("stores slugs and counts, and nothing that names the visitor", () => {
    likedStore.like(SLUG, 188);

    expect(Object.keys(window.localStorage)).toEqual([LIKED_STORAGE_KEY]);
    expect(window.localStorage.getItem(LIKED_STORAGE_KEY)).toBe(`{"version":2,"likes":{"${SLUG}":188}}`);
  });
});

describe("viewedStore", () => {
  it("keeps views in sessionStorage, so a new visit counts again", () => {
    viewedStore.add(SLUG);

    expect(VIEWED_STORAGE_KEY).toBe("memory-chess:article-viewed:v1");
    expect(JSON.parse(window.sessionStorage.getItem(VIEWED_STORAGE_KEY) ?? "null")).toEqual([SLUG]);
    expect(window.localStorage).toHaveLength(0);
    expect(viewedStore.has(SLUG)).toBe(true);
  });

  it("does not see a like as a view", () => {
    likedStore.like(SLUG, 188);

    expect(viewedStore.has(SLUG)).toBe(false);
  });
});
