/** @jest-environment node */

import { NextRequest } from "next/server";
import { GET } from "@/app/api/leaderboard/rank/route";
import { getStanding } from "@/lib/services/leaderboardService";

jest.mock("@/lib/services/leaderboardService", () => ({ getStanding: jest.fn() }));

const ENTRY_ID = "0b5e8f7c-3c1a-4e2b-9d4f-1a2b3c4d5e6f";
let nextAddress = 0;

/** Each test calls from its own address, so the limiter's counts from one test never reach another. */
function caller() {
  nextAddress += 1;
  const address = `203.0.113.${nextAddress}`;
  return (query: string) => GET(new NextRequest(`http://localhost/api/leaderboard/rank?${query}`, { headers: { "x-forwarded-for": address } }));
}

async function reply(response: Response) {
  return { status: response.status, body: await response.json(), cache: response.headers.get("Cache-Control") };
}

describe("GET /api/leaderboard/rank", () => {
  let logged: jest.SpyInstance;

  beforeEach(() => {
    jest.mocked(getStanding).mockReset().mockResolvedValue({ status: "ranked", standing: { difficulty: "medium", country: null, rank: 14, total: 200 } });
    logged = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => logged.mockRestore());

  it("answers a world standing for a stored entry id, uncached", async () => {
    const ask = caller();

    await expect(reply(await ask(`id=${ENTRY_ID}`))).resolves.toEqual({
      status: 200,
      body: { data: { difficulty: "medium", country: null, rank: 14, total: 200 } },
      cache: "no-store",
    });
    expect(jest.mocked(getStanding).mock.calls).toEqual([[ENTRY_ID, "world"]]);
  });

  it("passes a country scope through", async () => {
    await caller()(`id=${ENTRY_ID}&scope=country`);

    expect(jest.mocked(getStanding).mock.calls).toEqual([[ENTRY_ID, "country"]]);
  });

  it("refuses an id that is not an entry id, or an unknown scope, before reading the board", async () => {
    const ask = caller();
    const statuses = [(await ask("id=1")).status, (await ask(`id=${ENTRY_ID}&scope=planet`)).status, (await ask("")).status];

    expect(statuses).toEqual([400, 400, 400]);
    expect(getStanding).not.toHaveBeenCalled();
  });

  it("maps a missing entry to 404, no country to 400 and an unavailable board to 503", async () => {
    const ask = caller();
    const replies = [];
    for (const result of [{ status: "missing" }, { status: "noCountry" }, { status: "unavailable", cause: "down" }] as const) {
      jest.mocked(getStanding).mockResolvedValueOnce(result);
      replies.push(await reply(await ask(`id=${ENTRY_ID}`)));
    }

    expect(replies).toEqual([
      { status: 404, body: { error: "This entry is no longer on the leaderboard" }, cache: "no-store" },
      { status: 400, body: { error: "This entry has no country" }, cache: "no-store" },
      { status: 503, body: { error: "The leaderboard is unavailable. Please try again shortly." }, cache: "no-store" },
    ]);
  });

  it("allows ten checks a minute from one address and refuses the eleventh with a Retry-After", async () => {
    const ask = caller();
    const statuses = [];
    for (let check = 0; check < 10; check += 1) statuses.push((await ask(`id=${ENTRY_ID}`)).status);
    const refused = await ask(`id=${ENTRY_ID}`);
    const other = await caller()(`id=${ENTRY_ID}`);

    expect(statuses).toEqual(Array(10).fill(200));
    expect([refused.status, refused.headers.get("Retry-After"), await refused.json(), other.status]).toEqual([
      429,
      "60",
      { error: "Too many standing checks. Please wait a minute." },
      200,
    ]);
    expect(getStanding).toHaveBeenCalledTimes(11);
  });
});
