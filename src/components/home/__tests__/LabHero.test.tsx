import { renderWithIntl, screen } from "@/test-utils/intl";
import { LabHero } from "@/components/home/LabHero";
import { useTotalPlays } from "@/components/home/useLabEffects";

function HeroWithLivePlays() {
  return <LabHero totalPlays={useTotalPlays()} />;
}

describe("LabHero games-played readout", () => {
  it("shows the live count once the stat loads", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { metric_name: "total_plays", metric_value: 46543 } }),
    });
    renderWithIntl(<HeroWithLivePlays />);

    expect(await screen.findByText("46,543")).toBeInTheDocument();
    expect(screen.getByText("Games played")).toBeInTheDocument();
  });

  it("leaves the cell out while the stat is unavailable", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false });
    renderWithIntl(<HeroWithLivePlays />);

    expect(await screen.findByText("Exposure")).toBeInTheDocument();
    expect(screen.queryByText("Games played")).not.toBeInTheDocument();
  });
});
