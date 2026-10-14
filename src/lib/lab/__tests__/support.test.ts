import { browserIndexedDB } from "@/lib/lab/support";

const original = Object.getOwnPropertyDescriptor(window, "indexedDB");

afterEach(() => {
  if (original) Object.defineProperty(window, "indexedDB", original);
  else Reflect.deleteProperty(window, "indexedDB");
});

describe("browserIndexedDB", () => {
  it("returns the browser's IndexedDB when it has one", () => {
    const factory = {} as IDBFactory;
    Object.defineProperty(window, "indexedDB", { value: factory, configurable: true });

    expect(browserIndexedDB()).toBe(factory);
  });

  it("is undefined when the browser has none", () => {
    Object.defineProperty(window, "indexedDB", { value: undefined, configurable: true });

    expect(browserIndexedDB()).toBeUndefined();
  });

  it("is undefined when reading it throws, as it does with storage blocked", () => {
    Object.defineProperty(window, "indexedDB", {
      configurable: true,
      get() {
        throw new DOMException("blocked", "SecurityError");
      },
    });

    expect(browserIndexedDB()).toBeUndefined();
  });
});
