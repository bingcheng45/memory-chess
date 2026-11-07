import { recentKeys } from "../recentKeys";

describe("recentKeys", () => {
  it("reports a key as new until it is remembered, and as seen for the whole window", () => {
    const keys = recentKeys({ windowMs: 1000, maxKeys: 10 });

    expect(keys.isNew("a", 0)).toBe(true);
    expect(keys.remember("a", 0)).toBe(true);
    expect(keys.isNew("a", 999)).toBe(false);
    expect(keys.isNew("a", 1000)).toBe(true);
  });

  it("refuses a new key once full, without evicting a remembered one", () => {
    const keys = recentKeys({ windowMs: 1000, maxKeys: 2 });
    keys.remember("a", 0);
    keys.remember("b", 1);

    expect(keys.remember("c", 2)).toBe(false);
    expect(keys.isNew("a", 3)).toBe(false);
    expect(keys.isNew("c", 3)).toBe(true);
    expect(keys.size()).toBe(2);
  });

  it("takes new keys again once old ones expire", () => {
    const keys = recentKeys({ windowMs: 1000, maxKeys: 1 });
    keys.remember("a", 0);

    expect(keys.remember("b", 1000)).toBe(true);
    expect(keys.size()).toBe(1);
  });
});
