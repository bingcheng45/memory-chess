import { renderWithIntl, screen } from "@/test-utils/intl";
import { TrendChip } from "@/components/dashboard/TrendChip";

describe("TrendChip read by what progress means", () => {
  it("points a fall up and colours it better when lower is better, printing the signed change", () => {
    renderWithIntl(<TrendChip trend={{ direction: "down", amount: 0.5 }} betterWhen="lower" label="Speed down 0.5, better" />);
    const chip = screen.getByRole("img", { name: "Speed down 0.5, better" });

    expect([chip.dataset.trend, chip.dataset.tone, chip.querySelector("svg")?.dataset.arrow, chip.textContent]).toEqual(["down", "better", "up", "-0.5"]);
  });

  it("points a fall down and colours it worse when higher is better, printing the size of the fall", () => {
    renderWithIntl(<TrendChip trend={{ direction: "down", amount: 3 }} betterWhen="higher" label="Win streak down 3, worse" />);
    const chip = screen.getByRole("img", { name: "Win streak down 3, worse" });

    expect([chip.dataset.trend, chip.dataset.tone, chip.querySelector("svg")?.dataset.arrow, chip.textContent]).toEqual(["down", "worse", "down", "3"]);
  });
});
