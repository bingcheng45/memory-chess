import type { LeaderboardCutoffs } from "@/lib/leaderboard/ranking";

const STORAGE_KEY = "memory-chess:leaderboard-cutoffs:v1";
const TTL_MS = 10 * 60 * 1000;
const NOW = 1_700_000_000_000;

const PRODUCTION_EASY_WORST = {
  correctPieces: 2,
  totalWrongPieces: 0,
  memorizeTime: 3.917,
  solutionTime: 5.567,
};

const CUTOFFS: LeaderboardCutoffs = {
  easy: { kind: "full", worst: PRODUCTION_EASY_WORST },
  medium: { kind: "open" },
  hard: { kind: "open" },
  grandmaster: { kind: "open" },
};

async function importClient() {
  return import("@/lib/leaderboard/cutoffsClient");
}

function storeEntry(value: unknown) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

function mockFetch(response: unknown) {
  const fetchMock = jest.fn().mockResolvedValue(response);
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

function okResponse(body: unknown) {
  return { ok: true, json: async () => body };
}

describe("loadLeaderboardCutoffs", () => {
  beforeEach(() => {
    jest.resetModules();
    window.localStorage.clear();
    jest.spyOn(Date, "now").mockReturnValue(NOW);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("serves a cached entry inside the TTL without fetching", async () => {
    storeEntry({ fetchedAt: NOW - TTL_MS + 1000, cutoffs: CUTOFFS });
    const fetchMock = mockFetch(okResponse({ data: null }));
    const { loadLeaderboardCutoffs } = await importClient();

    await expect(loadLeaderboardCutoffs()).resolves.toEqual(CUTOFFS);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ["an entry older than the TTL", JSON.stringify({ fetchedAt: NOW - TTL_MS, cutoffs: CUTOFFS })],
    ["a corrupt entry that is not JSON", "{not json"],
    ["an entry whose shape parseCutoffs rejects", JSON.stringify({ fetchedAt: NOW, cutoffs: { easy: { kind: "open" } } })],
    ["an entry with no timestamp", JSON.stringify({ cutoffs: CUTOFFS })],
  ])("discards %s and fetches instead", async (_name, raw) => {
    window.localStorage.setItem(STORAGE_KEY, raw);
    const fetchMock = mockFetch(okResponse({ data: CUTOFFS }));
    const { loadLeaderboardCutoffs } = await importClient();

    await expect(loadLeaderboardCutoffs()).resolves.toEqual(CUTOFFS);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("caches a successful fetch under the versioned key", async () => {
    mockFetch(okResponse({ data: CUTOFFS }));
    const { loadLeaderboardCutoffs } = await importClient();

    await loadLeaderboardCutoffs();

    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null")).toEqual({
      fetchedAt: NOW,
      cutoffs: CUTOFFS,
    });
  });

  it("issues one request for concurrent callers and hands both the same value", async () => {
    let release: (body: unknown) => void = () => {};
    const pending = new Promise((resolve) => {
      release = resolve;
    });
    const fetchMock = jest.fn().mockReturnValue(pending);
    global.fetch = fetchMock as unknown as typeof fetch;
    const { loadLeaderboardCutoffs } = await importClient();

    const first = loadLeaderboardCutoffs();
    const second = loadLeaderboardCutoffs();
    release(okResponse({ data: CUTOFFS }));

    expect(await first).toEqual(CUTOFFS);
    expect(await second).toEqual(await first);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("refetches after the memo settles once the cached entry has expired", async () => {
    const fetchMock = mockFetch(okResponse({ data: CUTOFFS }));
    const { loadLeaderboardCutoffs } = await importClient();

    await loadLeaderboardCutoffs();
    (Date.now as jest.Mock).mockReturnValue(NOW + TTL_MS);
    await expect(loadLeaderboardCutoffs()).resolves.toEqual(CUTOFFS);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it.each([
    ["getItem"],
    ["setItem"],
  ])("still loads from the network when localStorage %s throws", async (method) => {
    jest
      .spyOn(Storage.prototype, method as "getItem" | "setItem")
      .mockImplementation(() => {
        throw new DOMException("denied", "SecurityError");
      });
    const fetchMock = mockFetch(okResponse({ data: CUTOFFS }));
    const { loadLeaderboardCutoffs } = await importClient();

    await expect(loadLeaderboardCutoffs()).resolves.toEqual(CUTOFFS);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("resolves null when the fetch rejects", async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError("offline")) as unknown as typeof fetch;
    const { loadLeaderboardCutoffs } = await importClient();

    await expect(loadLeaderboardCutoffs()).resolves.toBeNull();
  });

  it.each([
    ["a non-ok response", { ok: false, status: 500, json: async () => ({ data: CUTOFFS }) }],
    ["a body that is not JSON", { ok: true, json: async () => { throw new SyntaxError("not json"); } }],
    ["a body carrying null data", okResponse({ data: null })],
    ["a body whose data parseCutoffs rejects", okResponse({ data: { easy: { kind: "sealed" } } })],
  ])("resolves null for %s", async (_name, response) => {
    mockFetch(response);
    const { loadLeaderboardCutoffs } = await importClient();

    await expect(loadLeaderboardCutoffs()).resolves.toBeNull();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});

describe("warmLeaderboardCutoffs", () => {
  beforeEach(() => {
    jest.resetModules();
    window.localStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns without throwing when the fetch rejects", async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError("offline")) as unknown as typeof fetch;
    const { warmLeaderboardCutoffs } = await importClient();

    expect(() => warmLeaderboardCutoffs()).not.toThrow();
    await Promise.resolve();
  });

  it("fills the cache so a later load needs no fetch", async () => {
    const fetchMock = mockFetch(okResponse({ data: CUTOFFS }));
    const { warmLeaderboardCutoffs, loadLeaderboardCutoffs } = await importClient();

    warmLeaderboardCutoffs();
    await expect(loadLeaderboardCutoffs()).resolves.toEqual(CUTOFFS);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
