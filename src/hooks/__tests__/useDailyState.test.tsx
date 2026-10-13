import { act, renderHook } from "@testing-library/react";
import { dailyStateAt, useDailyState } from "@/hooks/useDailyState";
import { DAILY_OPENED_KEY } from "@/lib/lab/daily";
import { markDailyOpened } from "@/lib/lab/dailyBoard";

const at = (iso: string) => Date.parse(iso);

beforeEach(() => window.localStorage.clear());
afterEach(() => jest.useRealTimers());

describe("dailyStateAt", () => {
  it("is ready with the day's setting while today's board is unopened", () => {
    expect(dailyStateAt(at("2026-10-13T19:48:00Z"), null)).toEqual({
      status: "ready",
      day: "2026-10-13",
      setting: { pieceCount: 6, memorizeTime: 10 },
      left: { hours: 4, minutes: 11 },
    });
  });

  it("is ready when the board opened on this device was yesterday's, with 23 h 59 min left at midnight", () => {
    expect(dailyStateAt(at("2026-10-13T00:00:00Z"), "2026-10-12")).toMatchObject({ status: "ready", day: "2026-10-13", left: { hours: 23, minutes: 59 } });
  });

  it("is used once today's board was opened, with no whole minute left in the final minute", () => {
    expect(dailyStateAt(at("2026-10-13T23:59:00Z"), "2026-10-13")).toEqual({ status: "used", day: "2026-10-13", left: { hours: 0, minutes: 0 } });
  });
});

describe("useDailyState", () => {
  it("is null on the first render, so nothing date-based is served", () => {
    let first: unknown = "unset";
    renderHook(() => {
      const state = useDailyState();
      if (first === "unset") first = state;
      return state;
    });
    expect(first).toBeNull();
  });

  it("flips from used to tomorrow's ready board at UTC midnight without a reload", () => {
    jest.useFakeTimers({ now: at("2026-10-13T23:59:50Z") });
    window.localStorage.setItem(DAILY_OPENED_KEY, "2026-10-13");
    const { result } = renderHook(() => useDailyState());
    expect(result.current).toEqual({ status: "used", day: "2026-10-13", left: { hours: 0, minutes: 0 } });

    act(() => jest.advanceTimersByTime(9_999));
    expect(result.current?.status).toBe("used");

    act(() => jest.advanceTimersByTime(1));
    expect(result.current).toEqual({ status: "ready", day: "2026-10-14", setting: { pieceCount: 7, memorizeTime: 10 }, left: { hours: 23, minutes: 59 } });
  });

  it("counts down on each whole minute, not more often", () => {
    jest.useFakeTimers({ now: at("2026-10-13T19:47:30Z") });
    const renders: string[] = [];
    renderHook(() => {
      const state = useDailyState();
      if (state) renders.push(`${state.left.hours}:${state.left.minutes}`);
    });

    act(() => jest.advanceTimersByTime(29_999));
    act(() => jest.advanceTimersByTime(1));
    act(() => jest.advanceTimersByTime(60_000));
    expect(renders).toEqual(["4:12", "4:11", "4:10"]);
  });

  it("turns used when another tab opens the board", () => {
    jest.useFakeTimers({ now: at("2026-10-13T12:00:00Z") });
    const { result } = renderHook(() => useDailyState());
    expect(result.current?.status).toBe("ready");

    act(() => {
      window.localStorage.setItem(DAILY_OPENED_KEY, "2026-10-13");
      window.dispatchEvent(new StorageEvent("storage", { key: DAILY_OPENED_KEY, newValue: "2026-10-13" }));
    });
    expect(result.current?.status).toBe("used");
  });

  it("turns used as soon as this tab starts the board, with no storage event", () => {
    jest.useFakeTimers({ now: at("2026-10-13T12:00:00Z") });
    const { result } = renderHook(() => useDailyState());
    expect(result.current?.status).toBe("ready");

    act(() => markDailyOpened("2026-10-13"));
    expect(result.current?.status).toBe("used");
  });

  it("catches up when the page becomes visible again after the device slept past midnight", () => {
    jest.useFakeTimers({ now: at("2026-10-13T22:00:00Z") });
    window.localStorage.setItem(DAILY_OPENED_KEY, "2026-10-13");
    const { result } = renderHook(() => useDailyState());
    expect(result.current?.status).toBe("used");

    jest.setSystemTime(at("2026-10-14T07:30:20Z"));
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(result.current).toEqual({ status: "ready", day: "2026-10-14", setting: { pieceCount: 7, memorizeTime: 10 }, left: { hours: 16, minutes: 29 } });
  });

  it("catches up when the page is restored from the back-forward cache", () => {
    jest.useFakeTimers({ now: at("2026-10-13T22:00:00Z") });
    window.localStorage.setItem(DAILY_OPENED_KEY, "2026-10-13");
    const { result } = renderHook(() => useDailyState());

    jest.setSystemTime(at("2026-10-14T07:30:20Z"));
    act(() => {
      window.dispatchEvent(new Event("pageshow"));
    });
    expect(result.current?.day).toBe("2026-10-14");
  });
});

