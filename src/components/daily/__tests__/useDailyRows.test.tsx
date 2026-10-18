import { act, renderHook, waitFor } from "@testing-library/react";
import { useDailyRows } from "@/components/daily/useDailyRows";
import type { DailyTopRender } from "@/lib/daily/topTen";
import type { LeaderboardEntry } from "@/types/leaderboard";

const ROW = { id: "3c3c3c3c-0000-4000-8000-000000000003", player_name: "Poteto", difficulty: "daily", daily_day: "2026-10-13" } as LeaderboardEntry;
const NEW_ROW = { id: "3c3c3c3c-0000-4000-8000-000000000004", player_name: "Dino beta", difficulty: "daily", daily_day: "2026-10-13" } as LeaderboardEntry;
const RENDERED_AT = Date.parse("2026-10-13T09:00:00Z");
const RENDERED: DailyTopRender = { today: "2026-10-13", board: { day: "2026-10-13", rows: [ROW], playedLike: 1180 }, readAt: RENDERED_AT };
const FAILED_SERVER_READ: DailyTopRender = { today: "2026-10-13", board: null, readAt: RENDERED_AT };

let asked: string[] = [];

function answer(byUrl: (url: string) => { status?: number; body: unknown }) {
  asked = [];
  global.fetch = jest.fn(async (input: RequestInfo | URL) => {
    asked.push(String(input));
    const { status = 200, body } = byUrl(String(input));
    return { ok: status === 200, status, json: async () => body };
  }) as unknown as typeof fetch;
}

beforeEach(() => jest.spyOn(Date, "now").mockReturnValue(RENDERED_AT + 30_000));
afterEach(() => jest.restoreAllMocks());

describe("today's rows the server rendered", () => {
  it("shows them on the first render and asks the API nothing when the device agrees on the day", async () => {
    answer(() => ({ body: { data: [] } }));

    const { result } = renderHook(() => useDailyRows("2026-10-13", RENDERED, null));
    await act(async () => {});

    expect(result.current).toEqual({ state: "ready", board: { day: "2026-10-13", rows: [ROW], playedLike: 1180 } });
    expect(asked).toEqual([]);
  });

  it("shows them before the device's clock is read", () => {
    answer(() => ({ body: { data: [] } }));

    const { result } = renderHook(() => useDailyRows(null, RENDERED, null));

    expect(result.current).toEqual({ state: "ready", board: { day: "2026-10-13", rows: [ROW], playedLike: 1180 } });
    expect(asked).toEqual([]);
  });

  it("reads the device's own day when the page was rendered the day before", async () => {
    answer((url) => ({ body: { data: url.includes("2026-10-14") ? [NEW_ROW] : [] } }));

    const { result } = renderHook(() => useDailyRows("2026-10-14", RENDERED, null));

    await waitFor(() => expect(result.current).toEqual({ state: "ready", board: { day: "2026-10-14", rows: [NEW_ROW], playedLike: null } }));
    expect(asked).toEqual(["/api/leaderboard?difficulty=daily&daily_day=2026-10-14"]);
  });

  it("reads again when the page was rendered more than two minutes ago", async () => {
    jest.mocked(Date.now).mockReturnValue(RENDERED_AT + 121_000);
    answer(() => ({ body: { data: [ROW, NEW_ROW], playedLike: 1180 } }));

    const { result } = renderHook(() => useDailyRows("2026-10-13", RENDERED, null));

    await waitFor(() => expect(result.current).toEqual({ state: "ready", board: { day: "2026-10-13", rows: [ROW, NEW_ROW], playedLike: 1180 } }));
    expect(asked).toEqual(["/api/leaderboard?difficulty=daily&daily_day=2026-10-13"]);
  });

  it("reads the API when the server could not read the board", async () => {
    answer(() => ({ body: { data: [ROW], playedLike: null } }));

    const { result } = renderHook(() => useDailyRows("2026-10-13", FAILED_SERVER_READ, null));

    expect(result.current).toEqual({ state: "loading" });
    await waitFor(() => expect(result.current).toEqual({ state: "ready", board: { day: "2026-10-13", rows: [ROW], playedLike: null } }));
  });
});

describe("today's rows after this device joins", () => {
  it("reads the board again at an address no shared cache holds, and shows the new row", async () => {
    answer(() => ({ body: { data: [ROW, NEW_ROW], playedLike: 1180 } }));

    const { result, rerender } = renderHook(({ after }) => useDailyRows("2026-10-13", RENDERED, after), { initialProps: { after: null as string | null } });
    rerender({ after: NEW_ROW.id });

    await waitFor(() => expect(result.current).toEqual({ state: "ready", board: { day: "2026-10-13", rows: [ROW, NEW_ROW], playedLike: 1180 } }));
    expect(asked).toEqual(["/api/leaderboard?difficulty=daily&daily_day=2026-10-13&after=3c3c3c3c-0000-4000-8000-000000000004"]);
  });
});

describe("a new day nobody has joined yet", () => {
  it("shows yesterday's rows, which the board labels as yesterday's", async () => {
    answer((url) => ({ body: { data: url.includes("2026-10-13") ? [ROW] : [], playedLike: null } }));

    const { result } = renderHook(() => useDailyRows("2026-10-14", RENDERED, null));

    await waitFor(() => expect(result.current).toEqual({ state: "ready", board: { day: "2026-10-13", rows: [ROW], playedLike: null } }));
    expect(asked).toEqual(["/api/leaderboard?difficulty=daily&daily_day=2026-10-14", "/api/leaderboard?difficulty=daily&daily_day=2026-10-13"]);
  });
});

describe("today's rows when the database is down", () => {
  it("reads a 503 with the API's message as a failed read", async () => {
    answer(() => ({ status: 503, body: { data: [], error: "The leaderboard is unavailable. Please try again shortly." } }));

    const { result } = renderHook(() => useDailyRows("2026-10-13", FAILED_SERVER_READ, null));

    await waitFor(() => expect(result.current).toEqual({ state: "failed" }));
  });
});

describe("today's rows when the device's clock is off", () => {
  it("asks for the server's today when the server refuses the device's day", async () => {
    answer((url) => (url.includes("daily_day=") ? { status: 400, body: { error: "Invalid difficulty level" } } : { body: { data: [ROW] } }));

    const { result } = renderHook(() => useDailyRows("2026-10-20", RENDERED, null));

    await waitFor(() => expect(result.current).toEqual({ state: "ready", board: { day: "2026-10-20", rows: [ROW], playedLike: null } }));
    expect(asked).toEqual(["/api/leaderboard?difficulty=daily&daily_day=2026-10-20", "/api/leaderboard?difficulty=daily"]);
  });
});

describe("how today's board played", () => {
  it.each([
    ["a rating", 1340, 1340],
    ["no rating yet", null, null],
    ["something that is not a number", "1340", null],
  ])("reads %s from the board's answer", async (_case, playedLike, expected) => {
    answer(() => ({ body: { data: [ROW], playedLike } }));

    const { result } = renderHook(() => useDailyRows("2026-10-13", FAILED_SERVER_READ, null));

    await waitFor(() => expect(result.current).toEqual({ state: "ready", board: { day: "2026-10-13", rows: [ROW], playedLike: expected } }));
  });
});
