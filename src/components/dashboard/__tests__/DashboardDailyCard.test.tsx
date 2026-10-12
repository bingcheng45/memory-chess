import { act, renderWithIntl, screen } from "@/test-utils/intl";
import { Dashboard } from "@/components/dashboard/Dashboard";
import type { LabData } from "@/hooks/useLabData";
import { DAILY_OPENED_KEY } from "@/lib/lab/daily";
import { persona } from "@/test-utils/labPersona";
import type { PersonaName } from "@/lib/lab/personas";
import koMessages from "../../../../messages/ko.json";

jest.mock("@/lib/analytics/events", () => ({ ...jest.requireActual("@/lib/analytics/events"), trackEvent: jest.fn() }));

let labData: LabData;
jest.mock("@/hooks/useLabData", () => ({ ...jest.requireActual("@/hooks/useLabData"), useLabData: () => labData }));

const show = (name: PersonaName) => {
  labData = persona(name);
  return renderWithIntl(<Dashboard />);
};
const card = () => screen.queryByRole("region", { name: "Today's daily board is ready" });
const dailyTile = () => document.querySelector('[data-tile="daily"]')?.textContent;

beforeEach(() => {
  window.localStorage.clear();
  jest.useFakeTimers({ now: Date.parse("2026-10-08T15:00:00Z") });
});
afterEach(() => jest.useRealTimers());

describe("the dashboard's daily board card", () => {
  it("is the first thing under the page title while today's board is unplayed, with the day's setting and a Play link", () => {
    show("dailyOpen");

    const title = screen.getByRole("heading", { level: 1, name: "Dashboard" });
    expect(title.nextElementSibling).toBe(card());
    expect(card()).toHaveTextContent("Today's daily board is ready7 pieces and 9 seconds to study.Everyone plays the same board today, and you get one try.Play today's board");
    expect(screen.getByRole("link", { name: "Play today's board" })).toHaveAttribute("href", "/daily");
  });

  it("is gone once today's board was opened and left unfinished", () => {
    window.localStorage.setItem(DAILY_OPENED_KEY, "2026-10-08");
    show("dailyOpen");

    expect(card()).toBeNull();
  });

  it("is gone once today's board was played, as the daily tile also says", () => {
    window.localStorage.setItem(DAILY_OPENED_KEY, "2026-10-08");
    show("dailyPlayed");

    expect(card()).toBeNull();
    expect(dailyTile()).toMatch(/played/i);
  });

  it("comes back at UTC midnight for the next board without a reload", () => {
    window.localStorage.setItem(DAILY_OPENED_KEY, "2026-10-08");
    jest.setSystemTime(Date.parse("2026-10-08T23:59:30Z"));
    show("dailyOpen");
    expect(card()).toBeNull();

    act(() => jest.advanceTimersByTime(30_000));
    expect(card()).not.toBeNull();
  });

  it("speaks Korean on /ko/dashboard", () => {
    labData = persona("dailyOpen");
    renderWithIntl(<Dashboard />, { locale: "ko", messages: koMessages });

    expect(screen.getByRole("region", { name: "오늘의 데일리 보드가 준비됐어요" })).toHaveTextContent("기물 7개, 암기 시간 9초.");
  });
});
