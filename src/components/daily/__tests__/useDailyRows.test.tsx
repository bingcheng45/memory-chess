import { renderHook, waitFor } from "@testing-library/react";
import { useDailyRows } from "@/components/daily/useDailyRows";

const ROW = { id: "3c3c3c3c-0000-4000-8000-000000000003", player_name: "Poteto", difficulty: "daily", daily_day: "2026-10-13" };

describe("today's rows when the device's clock is off", () => {
  it("asks for the server's today when the server refuses the device's day", async () => {
    const asked: string[] = [];
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      asked.push(String(input));
      return String(input).includes("daily_day=")
        ? { ok: false, status: 400, json: async () => ({ error: "Invalid difficulty level" }) }
        : { ok: true, status: 200, json: async () => ({ data: [ROW] }) };
    }) as unknown as typeof fetch;

    const { result } = renderHook(() => useDailyRows("2026-10-20", 0));

    await waitFor(() => expect(result.current).toEqual({ state: "ready", rows: [ROW] }));
    expect(asked).toEqual(["/api/leaderboard?difficulty=daily&daily_day=2026-10-20", "/api/leaderboard?difficulty=daily"]);
  });
});
