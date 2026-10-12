import { renderWithIntl, screen, within } from "@/test-utils/intl";
import { TileList } from "@/components/dashboard/DashboardTiles";
import { useContextText } from "@/components/dashboard/figureText";
import type { DashboardTile, Trend } from "@/lib/lab/dashboard";

const ratingTile = (change: number, rounds: number, trend?: Trend): DashboardTile => ({
  id: "rating",
  state: "ready",
  figure: { value: 1102, unit: "rating", digits: 0 },
  context: { kind: "rating", values: { sign: change > 0 ? "up" : change < 0 ? "down" : "level", change: Math.abs(change), rounds } },
  ...(trend && { trend }),
});

const show = (tile: DashboardTile) => {
  renderWithIntl(<TileList ids={["rating"]} tiles={[tile]} size="lead" />);
  return document.querySelector('[data-tile="rating"]') as HTMLElement;
};

describe("rating tile trend", () => {
  it("marks a rise with an up arrow, the amount and an accessible label, beside the sentence that keeps its own words", () => {
    const tile = show(ratingTile(27, 5, { direction: "up", amount: 27 }));
    const chip = within(tile).getByRole("img", { name: "Rating up 27" });

    expect(chip).toHaveAttribute("data-trend", "up");
    expect(chip.textContent).toBe("27");
    expect(chip.querySelector("svg")).toHaveAttribute("data-arrow", "up");
    expect(tile.textContent).toContain("Up 27 over your last 5 rated rounds");
  });

  it("marks a fall with a down arrow and the size of the fall", () => {
    const tile = show(ratingTile(-12, 3, { direction: "down", amount: 12 }));
    const chip = within(tile).getByRole("img", { name: "Rating down 12" });

    expect(chip).toHaveAttribute("data-trend", "down");
    expect(chip.textContent).toBe("12");
    expect(chip.querySelector("svg")).toHaveAttribute("data-arrow", "down");
  });

  it("draws no chip when the rating is level or has no rated round behind it", () => {
    expect(within(show(ratingTile(0, 2, { direction: "level", amount: 0 }))).queryByRole("img")).toBeNull();
  });
});

describe("rating sentence", () => {
  const sentence = (change: number, rounds: number) => {
    const values = { sign: change > 0 ? "up" : change < 0 ? "down" : "level", change: Math.abs(change), rounds };
    function Probe() {
      return <p data-testid="probe">{useContextText()({ kind: "rating", values })}</p>;
    }
    const { unmount } = renderWithIntl(<Probe />);
    const text = screen.getByTestId("probe").textContent;
    unmount();
    return text;
  };

  it("reads naturally for one rated round", () => {
    expect(sentence(30, 1)).toBe("Up 30 in your last rated round");
    expect(sentence(-8, 1)).toBe("Down 8 in your last rated round");
    expect(sentence(0, 1)).toBe("No change in your last rated round");
  });

  it("keeps the count for several rounds", () => {
    expect(sentence(27, 5)).toBe("Up 27 over your last 5 rated rounds");
  });
});
