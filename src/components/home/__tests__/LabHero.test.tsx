import { renderWithIntl, screen, within } from "@/test-utils/intl";
import { LabHero } from "@/components/home/LabHero";
import { useTotalPlays } from "@/components/home/useLabEffects";
import de from "../../../../messages/de.json";

function HeroWithLivePlays() {
  return <LabHero totalPlays={useTotalPlays()} />;
}

const statsRow = () => within(screen.getByText("study window").closest(".lab-facts") as HTMLElement);

describe("LabHero", () => {
  it("shows the matchup and the date of the position it walks through", () => {
    renderWithIntl(<LabHero totalPlays={{ status: "loading" }} />);

    expect(screen.getByText("Veselin Topalov")).toBeInTheDocument();
    expect(screen.getByText("Alexey Shirov")).toBeInTheDocument();
    expect(screen.getByText("4 March 1998")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: / on [a-h][1-8]$/ })).toHaveLength(10);
  });

  it("links today's daily board", () => {
    renderWithIntl(<LabHero totalPlays={{ status: "loading" }} />);

    expect(screen.getByRole("link", { name: "today's daily board" })).toHaveAttribute("href", "/daily");
    expect(screen.getByText(/the same position for every player\./)).toBeInTheDocument();
  });
});

const factTexts = () =>
  Array.from(document.querySelectorAll(".lab-facts > div"), (fact) => [fact.querySelector("b")?.textContent, fact.textContent]);

describe("LabHero games-played stat", () => {
  it("leads the stats row with the live count once it loads, and drops the accuracy reading", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { metric_name: "total_plays", metric_value: 46543 } }),
    });
    renderWithIntl(<HeroWithLivePlays />);

    expect(await statsRow().findByText("46,543")).toBeInTheDocument();
    expect(factTexts()).toEqual([
      ["46,543", "46,543games played"],
      ["1–60s", "1–60sstudy window"],
      ["2–32", "2–32pieces per round"],
      ["24", "24languages"],
    ]);
  });

  it("holds the slot with the label and a placeholder while the count loads", () => {
    renderWithIntl(<LabHero totalPlays={{ status: "loading" }} />);

    expect(factTexts()[0]).toEqual(["–", "–games played"]);
    expect(document.querySelector(".lab-fact-lead")).toHaveAttribute("aria-busy", "true");
  });

  it("keeps the placeholder when the count is unavailable", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false });
    renderWithIntl(<HeroWithLivePlays />);

    await statsRow().findByText("games played");
    await screen.findByText((_, element) => element?.getAttribute("data-status") === "unavailable");
    expect(factTexts()[0]).toEqual(["–", "–games played"]);
    expect(factTexts()).toHaveLength(4);
  });

  it("words a count of one in the singular", () => {
    renderWithIntl(<LabHero totalPlays={{ status: "known", plays: 1 }} />);

    expect(factTexts()[0]).toEqual(["1", "1game played"]);
  });

  it("writes the count the way the page's language writes numbers", () => {
    renderWithIntl(<LabHero totalPlays={{ status: "known", plays: 46543 }} />, { locale: "de", messages: de });

    expect(factTexts()[0]).toEqual(["46.543", "46.543gespielte Partien"]);
  });
});
