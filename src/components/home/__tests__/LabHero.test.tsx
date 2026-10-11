import { renderWithIntl, screen, within } from "@/test-utils/intl";
import { LabHero } from "@/components/home/LabHero";
import { useTotalPlays } from "@/components/home/useLabEffects";

function HeroWithLivePlays() {
  return <LabHero totalPlays={useTotalPlays()} />;
}

const statsRow = () => within(screen.getByText("study window").closest(".lab-facts") as HTMLElement);

describe("LabHero", () => {
  it("shows the matchup and the date of the position it walks through", () => {
    renderWithIntl(<LabHero totalPlays={null} />);

    expect(screen.getByText("Veselin Topalov")).toBeInTheDocument();
    expect(screen.getByText("Alexey Shirov")).toBeInTheDocument();
    expect(screen.getByText("4 March 1998")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: / on [a-h][1-8]$/ })).toHaveLength(10);
  });
});

describe("LabHero games-played stat", () => {
  it("shows the live count in the stats row once it loads", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { metric_name: "total_plays", metric_value: 46543 } }),
    });
    renderWithIntl(<HeroWithLivePlays />);

    expect(await statsRow().findByText("46,543")).toBeInTheDocument();
    expect(statsRow().getByText("games played")).toBeInTheDocument();
    expect(statsRow().queryByText("accuracy reading")).not.toBeInTheDocument();
  });

  it("keeps the accuracy reading while the count is unavailable", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false });
    renderWithIntl(<HeroWithLivePlays />);

    expect(await statsRow().findByText("accuracy reading")).toBeInTheDocument();
    expect(statsRow().getByText("0–100%")).toBeInTheDocument();
    expect(statsRow().queryByText("games played")).not.toBeInTheDocument();
    expect(statsRow().getAllByText(/./, { selector: "b" })).toHaveLength(4);
  });
});
