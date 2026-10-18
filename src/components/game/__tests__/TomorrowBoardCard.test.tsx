import { act, render, screen } from "@/test-utils/intl";
import TomorrowBoardCard from "@/components/game/TomorrowBoardCard";
import { DAILY_OPENED_KEY } from "@/lib/lab/daily";

const card = () => screen.getByRole("region", { name: "Tomorrow's board" });

function renderAt(iso: string) {
  jest.useFakeTimers({ now: Date.parse(iso) });
  render(<TomorrowBoardCard />);
  act(() => {});
}

beforeEach(() => window.localStorage.clear());
afterEach(() => jest.useRealTimers());

describe("TomorrowBoardCard", () => {
  it("says when tomorrow's board opens and its size, and links to today's board with its size while it is unplayed", () => {
    renderAt("2026-10-13T19:48:00Z");

    expect(card()).toHaveTextContent("7 pieces and 10 seconds to study. Opens in 4 h 11 min.");
    expect(screen.getByRole("link", { name: "Today's board · 6 pieces · 10 s · 4 h 11 min left" })).toHaveAttribute("href", "/daily");
  });

  it("links to today's board without offering it again once it was played", () => {
    window.localStorage.setItem(DAILY_OPENED_KEY, "2026-10-13");
    renderAt("2026-10-13T23:30:00Z");

    expect(card()).toHaveTextContent("7 pieces and 10 seconds to study. Opens in 29 min.");
    expect(screen.getByRole("link", { name: "See today's board" })).toHaveAttribute("href", "/daily");
  });
});
