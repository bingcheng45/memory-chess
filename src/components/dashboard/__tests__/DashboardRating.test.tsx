import { fireEvent } from "@testing-library/react";
import { renderWithIntl, screen } from "@/test-utils/intl";
import { DashboardRating } from "@/components/dashboard/DashboardRating";
import { ratingHistoryOf } from "@/lib/lab/ratingHistory";

const NOW = Date.UTC(2026, 9, 18, 12);
const daysAgo = (days: number) => NOW - days * 86_400_000;

/** jsdom has no layout, so the plot is handed the size a browser would measure. */
class SizedResizeObserver {
  constructor(private readonly callback: ResizeObserverCallback) {}
  observe() {
    this.callback([{ contentRect: { width: 600, height: 220 } } as ResizeObserverEntry], this as unknown as ResizeObserver);
  }
  unobserve() {}
  disconnect() {}
}

const original = window.ResizeObserver;
beforeEach(() => {
  window.ResizeObserver = SizedResizeObserver as unknown as typeof ResizeObserver;
});
afterEach(() => {
  window.ResizeObserver = original;
});

const rising = ratingHistoryOf(
  1025,
  [
    { timestamp: daysAgo(1), skillRatingChange: 10 },
    { timestamp: daysAgo(3), skillRatingChange: -5 },
    { timestamp: daysAgo(10), skillRatingChange: 20 },
  ],
  NOW,
);

const rowsOf = () => [...document.querySelectorAll(".lab-sr tbody tr")].map((row) => [...row.children].map((cell) => cell.textContent));
const marks = () => [...document.querySelectorAll(".lab-pc-mark")].map((mark) => mark.textContent);

describe("DashboardRating", () => {
  it("leads with the current rating and its change over the last 7 days, and marks a new peak", () => {
    renderWithIntl(<DashboardRating history={rising} />);

    expect(document.querySelector(".lab-rating-value")?.textContent).toBe("1,025");
    expect(screen.getByRole("img", { name: "Rating up 5" })).toBeInTheDocument();
    expect(screen.getByText("in the last 7 days")).toBeInTheDocument();
    expect(marks()).toEqual(["New peak"]);
    expect(screen.getByRole("img", { name: "Skill rating over your last 3 rated rounds, from 1,000 to 1,025, peak 1,025." })).toBeInTheDocument();
  });

  it("lists every point of the line in the hidden table", () => {
    renderWithIntl(<DashboardRating history={rising} />);

    expect([...document.querySelectorAll(".lab-sr th")].map((cell) => cell.textContent)).toEqual(["Round", "Date", "Rating", "Change"]);
    expect(rowsOf()).toEqual([
      ["Start", "", "1,000", ""],
      ["1", "Oct 8, 2026", "1,020", "+20"],
      ["2", "Oct 15, 2026", "1,015", "-5"],
      ["3", "Oct 17, 2026", "1,025", "+10"],
    ]);
  });

  it("names an older peak, and counts every held round when none fall in the last 7 days", () => {
    const history = ratingHistoryOf(
      1018,
      [
        { timestamp: daysAgo(9), skillRatingChange: -12 },
        { timestamp: daysAgo(12), skillRatingChange: 30 },
      ],
      NOW,
    );
    renderWithIntl(<DashboardRating history={history} />);

    expect(marks()).toEqual(["Peak 1,030"]);
    expect(screen.getByRole("img", { name: "Rating up 18" })).toBeInTheDocument();
    expect(screen.getByText("over your last 2 rounds")).toBeInTheDocument();
  });

  it("says when the rating has not moved in the last 7 days", () => {
    const history = ratingHistoryOf(
      1000,
      [
        { timestamp: daysAgo(1), skillRatingChange: 6 },
        { timestamp: daysAgo(2), skillRatingChange: -6 },
      ],
      NOW,
    );
    renderWithIntl(<DashboardRating history={history} />);

    expect(document.querySelector(".lab-rating-period")?.textContent).toBe("No change in the last 7 days");
  });

  it("reads out the round under the crosshair as the arrow keys move it", () => {
    renderWithIntl(<DashboardRating history={rising} />);
    const plot = document.querySelector<HTMLElement>(".lab-pc-plot") as HTMLElement;
    const tip = () => document.querySelector(".lab-pc-tip");

    plot.focus();
    fireEvent.keyDown(plot, { key: "End" });
    expect(tip()?.textContent).toBe("1,025Oct 17, 2026 · +10");
    fireEvent.keyDown(plot, { key: "ArrowLeft" });
    expect(tip()?.textContent).toBe("1,015Oct 15, 2026 · -5");
    fireEvent.keyDown(plot, { key: "Home" });
    expect(tip()?.textContent).toBe("1,000Start");
    fireEvent.keyDown(plot, { key: "Escape" });
    expect(tip()?.textContent).toBe("");
  });

  it("invites a first rated round instead of an empty line", () => {
    renderWithIntl(<DashboardRating history={null} />);

    expect(screen.getByText("Play a rated round in the game to start your rating line.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Play a round →" })).toHaveAttribute("href", "/game?pieceCount=6&memorizeTime=10&source=dashboard");
    expect(document.querySelector(".lab-pc-svg")).toBeNull();
  });

  it("holds the card's boxes open while the store loads, with nothing in them", () => {
    renderWithIntl(<DashboardRating history="pending" />);

    expect(document.querySelector(".lab-rating-hero")?.textContent).toBe("");
    expect(document.querySelector('.lab-pc-plot[data-variant="rating"]')?.textContent).toBe("");
    expect(screen.getByRole("heading", { name: "Rating over time" })).toBeInTheDocument();
  });
});
