import { checkStanding } from "@/lib/leaderboard/standingClient";

const ID = "0b5e8f7c-3c1a-4e2b-9d4f-1a2b3c4d5e6f";

/** Shaped like a fetch Response for the fields the client reads; jsdom has no Response. */
function answer(status: number, body: unknown, headers: Record<string, string> = {}) {
  global.fetch = jest.fn().mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    headers: { get: (name: string) => headers[name] ?? null },
    json: async () => body,
  });
}

const online = (value: boolean) => jest.spyOn(window.navigator, "onLine", "get").mockReturnValue(value);

describe("checkStanding", () => {
  beforeEach(() => online(true));
  afterEach(() => jest.restoreAllMocks());

  it("asks the rank endpoint for the entry and scope, and stamps the answer with when it arrived", async () => {
    answer(200, { data: { difficulty: "medium", country: null, rank: 14, total: 200 } });

    await expect(checkStanding(ID, "country", () => 5_000)).resolves.toEqual({
      kind: "ranked",
      standing: { difficulty: "medium", country: null, rank: 14, total: 200 },
      checkedAt: 5_000,
    });
    expect(jest.mocked(global.fetch).mock.calls).toEqual([[`/api/leaderboard/rank?id=${ID}&scope=country`, { cache: "no-store" }]]);
  });

  it("reads 404 as an entry the board no longer has, and 429 with its wait", async () => {
    answer(404, { error: "gone" });
    const missing = await checkStanding(ID, "world", () => 7_000);
    answer(429, { error: "slow down" }, { "Retry-After": "37" });
    const limited = await checkStanding(ID, "world");
    answer(429, { error: "slow down" });
    const limitedNoHeader = await checkStanding(ID, "world");

    expect([missing, limited, limitedNoHeader]).toEqual([
      { kind: "missing", checkedAt: 7_000 },
      { kind: "limited", retryAfterSeconds: 37 },
      { kind: "limited", retryAfterSeconds: 60 },
    ]);
  });

  it("sends nothing while the browser is offline", async () => {
    online(false);
    global.fetch = jest.fn();

    await expect(checkStanding(ID, "world")).resolves.toEqual({ kind: "offline" });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("reads a network error, a server error or a reply that is not a rank as failed", async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    const unreachable = await checkStanding(ID, "world");
    answer(503, { error: "down" });
    const down = await checkStanding(ID, "world");
    answer(200, { data: { rank: "first" } });
    const garbled = await checkStanding(ID, "world");

    expect([unreachable, down, garbled]).toEqual([{ kind: "failed" }, { kind: "failed" }, { kind: "failed" }]);
  });
});
