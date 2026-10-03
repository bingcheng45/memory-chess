import { LIKED_STORAGE_KEY, likedStore } from "@/lib/articles/likedStore";
import { VIEWED_STORAGE_KEY, viewedStore } from "@/lib/articles/viewedStore";

const SLUG = "alder-fixture";

const full = () => {
  throw new DOMException("The quota has been exceeded.", "QuotaExceededError");
};

afterEach(() => {
  jest.restoreAllMocks();
  likedStore.remove(SLUG);
  viewedStore.remove(SLUG);
  window.localStorage.clear();
  window.sessionStorage.clear();
});

describe("likedStore", () => {
  it("keeps likes in localStorage, so they outlive the tab", () => {
    likedStore.add(SLUG);

    expect(LIKED_STORAGE_KEY).toBe("memory-chess:article-likes:v1");
    expect(JSON.parse(window.localStorage.getItem(LIKED_STORAGE_KEY) ?? "null")).toEqual([SLUG]);
    expect(window.sessionStorage).toHaveLength(0);
    expect(likedStore.has(SLUG)).toBe(true);
  });

  it("forgets an unlike", () => {
    likedStore.add(SLUG);
    likedStore.remove(SLUG);

    expect(likedStore.has(SLUG)).toBe(false);
    expect(JSON.parse(window.localStorage.getItem(LIKED_STORAGE_KEY) ?? "null")).toEqual([]);
  });

  it("reads a like that an earlier visit stored", () => {
    window.localStorage.setItem(LIKED_STORAGE_KEY, JSON.stringify([SLUG]));

    expect(likedStore.has(SLUG)).toBe(true);
  });

  it("likes and unlikes within the page when the storage refuses every write", () => {
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(full);

    likedStore.add(SLUG);
    expect(likedStore.has(SLUG)).toBe(true);

    likedStore.remove(SLUG);
    expect(likedStore.has(SLUG)).toBe(false);
  });

  it("stores slugs and nothing that names the visitor", () => {
    likedStore.add(SLUG);

    expect(Object.keys(window.localStorage)).toEqual([LIKED_STORAGE_KEY]);
    expect(window.localStorage.getItem(LIKED_STORAGE_KEY)).toBe(JSON.stringify([SLUG]));
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
    likedStore.add(SLUG);

    expect(viewedStore.has(SLUG)).toBe(false);
  });
});
