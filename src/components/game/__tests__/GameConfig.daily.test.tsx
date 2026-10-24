import { act, render, renderWithIntl, screen } from "@/test-utils/intl";
import GameConfig from "@/components/game/GameConfig";
import { DAILY_OPENED_KEY } from "@/lib/lab/daily";
import koMessages from "../../../../messages/ko.json";

const TUESDAY_EVENING = Date.parse("2026-10-13T19:48:00Z");

const dailyLink = () => screen.getByRole("link", { name: /board/ });

beforeEach(() => {
  window.localStorage.clear();
  jest.useFakeTimers({ now: TUESDAY_EVENING });
});
afterEach(() => jest.useRealTimers());

describe("GameConfig daily board link", () => {
  it("sits directly under the Start round bar and links to the daily page", () => {
    render(<GameConfig />);

    const bar = screen.getByRole("button", { name: "Start round" }).closest("[data-start-bar]");
    expect(bar?.nextElementSibling).toBe(dailyLink());
    expect(dailyLink()).toHaveAttribute("href", "/daily");
    expect(dailyLink()).toHaveClass("lab-btn-secondary");
  });

  it("reads the day's setting and the time left while today's board is unplayed", () => {
    render(<GameConfig />);

    expect(dailyLink()).toHaveTextContent("Today's board · 6 pieces · 10 s · 4 h 11 min left");
  });

  it("reads the next board time once today's board was opened and left unfinished", () => {
    window.localStorage.setItem(DAILY_OPENED_KEY, "2026-10-13");
    render(<GameConfig />);

    expect(dailyLink()).toHaveTextContent("Next board in 4 h 11 min");
  });

  it("reads minutes alone in the last hour before the next board", () => {
    window.localStorage.setItem(DAILY_OPENED_KEY, "2026-10-13");
    jest.setSystemTime(Date.parse("2026-10-13T23:30:00Z"));
    render(<GameConfig />);

    expect(dailyLink()).toHaveTextContent("Next board in 29 min");
  });

  it("offers tomorrow's board after UTC midnight without a reload", () => {
    window.localStorage.setItem(DAILY_OPENED_KEY, "2026-10-13");
    jest.setSystemTime(Date.parse("2026-10-13T23:59:00Z"));
    render(<GameConfig />);
    expect(dailyLink()).toHaveTextContent("Next board in under a minute");

    act(() => jest.advanceTimersByTime(60_000));
    expect(dailyLink()).toHaveTextContent("Today's board · 7 pieces · 10 s · 23 h 59 min left");
  });

  it("speaks Korean on /ko/game", () => {
    renderWithIntl(<GameConfig />, { locale: "ko", messages: koMessages });

    expect(screen.getByRole("link", { name: /오늘의 보드/ })).toHaveTextContent("오늘의 보드 · 기물 6개 · 10초 · 4시간 11분 남음");
  });
});
