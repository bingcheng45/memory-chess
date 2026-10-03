import { createSlugSetStore } from "@/lib/articles/slugSetStore";

const KEY = "memory-chess:test-slugs:v1";
const STORAGES = ["localStorage", "sessionStorage"] as const;

const blocked = () => {
  throw new DOMException("The operation is insecure.", "SecurityError");
};
const full = () => {
  throw new DOMException("The quota has been exceeded.", "QuotaExceededError");
};

afterEach(() => {
  jest.restoreAllMocks();
  window.localStorage.clear();
  window.sessionStorage.clear();
});

describe.each(STORAGES)("a slug set kept in %s", (name) => {
  const stored = () => window[name].getItem(KEY);
  const store = () => createSlugSetStore(name, KEY);

  it("holds nothing before anything is added", () => {
    expect(store().has("alder")).toBe(false);
    expect(stored()).toBeNull();
  });

  it("remembers an added slug as a JSON array, and a second store reads it back", () => {
    store().add("alder");

    expect(JSON.parse(stored() ?? "null")).toEqual(["alder"]);
    expect(store().has("alder")).toBe(true);
    expect(store().has("birch")).toBe(false);
  });

  it("adds a slug once and removes it again", () => {
    const slugs = store();

    slugs.add("alder");
    slugs.add("alder");
    slugs.add("birch");
    expect(JSON.parse(stored() ?? "null")).toEqual(["alder", "birch"]);

    slugs.remove("alder");
    expect(JSON.parse(stored() ?? "null")).toEqual(["birch"]);
    expect(slugs.has("alder")).toBe(false);
  });

  it.each([
    ["text that is not JSON", "{not json"],
    ["an object", JSON.stringify({ alder: true })],
    ["an array holding a number", JSON.stringify(["alder", 7])],
    ["a bare string", JSON.stringify("alder")],
    ["null", "null"],
  ])("reads %s as empty and writes a clean array over it", (_, raw) => {
    window[name].setItem(KEY, raw);
    const slugs = store();

    expect(slugs.has("alder")).toBe(false);

    slugs.add("birch");
    expect(JSON.parse(stored() ?? "null")).toEqual(["birch"]);
  });

  it("still remembers within the page when the storage itself cannot be reached", () => {
    jest.spyOn(window, name, "get").mockImplementation(blocked);
    const slugs = store();

    expect(slugs.has("alder")).toBe(false);
    expect(() => slugs.add("alder")).not.toThrow();
    expect(slugs.has("alder")).toBe(true);
    expect(() => slugs.remove("alder")).not.toThrow();
    expect(slugs.has("alder")).toBe(false);

    jest.restoreAllMocks();
    expect(stored()).toBeNull();
  });

  it("reads as empty when a read throws", () => {
    window[name].setItem(KEY, JSON.stringify(["alder"]));
    jest.spyOn(Storage.prototype, "getItem").mockImplementation(blocked);

    expect(store().has("alder")).toBe(false);
  });

  it("keeps what it could not save, though the storage still answers with its old value", () => {
    window[name].setItem(KEY, JSON.stringify(["alder"]));
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(full);
    const slugs = store();

    expect(() => slugs.add("birch")).not.toThrow();
    expect(slugs.has("birch")).toBe(true);
    expect(() => slugs.remove("alder")).not.toThrow();
    expect(slugs.has("alder")).toBe(false);
  });

  it("goes back to the storage once a write lands again", () => {
    const refuse = jest.spyOn(Storage.prototype, "setItem").mockImplementation(full);
    const slugs = store();
    slugs.add("alder");
    refuse.mockRestore();

    slugs.add("birch");

    expect(JSON.parse(stored() ?? "null")).toEqual(["alder", "birch"]);
    window[name].setItem(KEY, JSON.stringify(["cedar"]));
    expect(slugs.has("cedar")).toBe(true);
    expect(slugs.has("alder")).toBe(false);
  });

  it("tells a subscriber about every change, until it leaves", () => {
    const slugs = store();
    const onChange = jest.fn();
    const leave = slugs.subscribe(onChange);

    slugs.add("alder");
    slugs.remove("alder");
    expect(onChange).toHaveBeenCalledTimes(2);

    leave();
    slugs.add("alder");
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("tells a subscriber when the storage refuses the write too", () => {
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(full);
    const slugs = store();
    const onChange = jest.fn();
    slugs.subscribe(onChange);

    slugs.add("alder");

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("follows a change made in another tab, and ignores other keys", () => {
    const slugs = store();
    const onChange = jest.fn();
    const leave = slugs.subscribe(onChange);

    window[name].setItem(KEY, JSON.stringify(["alder"]));
    window.dispatchEvent(new StorageEvent("storage", { key: "some-other-key" }));
    expect(onChange).not.toHaveBeenCalled();

    window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(slugs.has("alder")).toBe(true);

    window.dispatchEvent(new StorageEvent("storage", { key: null }));
    expect(onChange).toHaveBeenCalledTimes(2);

    leave();
    window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
    expect(onChange).toHaveBeenCalledTimes(2);
  });
});

describe("two stores", () => {
  it("keep their slugs apart", () => {
    const liked = createSlugSetStore("localStorage", KEY);
    const viewed = createSlugSetStore("sessionStorage", KEY);

    liked.add("alder");

    expect(viewed.has("alder")).toBe(false);
  });

  it("keep what they could not save apart", () => {
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(full);
    const liked = createSlugSetStore("localStorage", KEY);
    const viewed = createSlugSetStore("sessionStorage", KEY);

    liked.add("alder");

    expect(liked.has("alder")).toBe(true);
    expect(viewed.has("alder")).toBe(false);
  });
});
