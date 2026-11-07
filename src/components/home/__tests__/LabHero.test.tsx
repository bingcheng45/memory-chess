import { act, renderWithIntl, screen, waitFor, within } from "@/test-utils/intl";
import { LabHero } from "@/components/home/LabHero";
import de from "../../../../messages/de.json";

beforeEach(() => {
  global.fetch = jest.fn(() => new Promise(() => {})) as jest.Mock;
});

const statsRow = () => within(screen.getByText("study window").closest(".lab-facts") as HTMLElement);

describe("LabHero", () => {
  it("shows the matchup and the date of the position it walks through", () => {
    renderWithIntl(<LabHero />);

    expect(screen.getByText("Veselin Topalov")).toBeInTheDocument();
    expect(screen.getByText("Alexey Shirov")).toBeInTheDocument();
    expect(screen.getByText("4 March 1998")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: / on [a-h][1-8]$/ })).toHaveLength(10);
  });

  it("links today's daily board", () => {
    renderWithIntl(<LabHero />);

    expect(screen.getByRole("link", { name: "today's daily board" })).toHaveAttribute("href", "/daily");
    expect(screen.getByText(/the same position for every player\./)).toBeInTheDocument();
  });

  it("points readers who wanted the wooden board game at its rules", () => {
    renderWithIntl(<LabHero />);

    expect(screen.getByText(/Looking for the wooden Memory Chess board game\?/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Read its rules" })).toHaveAttribute("href", "/learn/how-to-play-memory-chess-board-game");
  });

  it("marks the rules link as English from a translated home page", () => {
    renderWithIntl(<LabHero />, { locale: "de", messages: de });

    expect(screen.getByRole("link", { name: "Zu den Spielregeln (English)" })).toHaveAttribute("hrefLang", "en");
  });
});

const factTexts = () =>
  Array.from(document.querySelectorAll(".lab-facts > div"), (fact) => [fact.querySelector("b")?.textContent, fact.textContent]);

describe("LabHero games-played stat", () => {
  it("leads the stats row with the live count once it loads, and drops the accuracy reading", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { metric_name: "total_plays", metric_value: 46543, last_updated: "2026-10-19T18:30:00.000Z" } }),
    });
    renderWithIntl(<LabHero />);

    expect(await statsRow().findByText("46,543")).toBeInTheDocument();
    expect(factTexts()).toEqual([
      ["46,543", "46,543games played"],
      ["1–60s", "1–60sstudy window"],
      ["2–32", "2–32pieces per round"],
      ["24", "24languages"],
    ]);
  });

  it("starts from the count the server read, then takes the browser's newer one", async () => {
    let answer: (response: unknown) => void = () => {};
    global.fetch = jest.fn(() => new Promise((resolve) => (answer = resolve))) as jest.Mock;
    renderWithIntl(<LabHero initialPlays={49631} />);

    expect(factTexts()[0]).toEqual(["49,631", "49,631games played"]);
    answer({ ok: true, json: async () => ({ data: { metric_name: "total_plays", metric_value: "49702", last_updated: "2026-10-19T18:30:00.000Z" } }) });
    expect(await statsRow().findByText("49,702")).toBeInTheDocument();
  });

  it("keeps the server's count when the browser's request fails", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false });
    renderWithIntl(<LabHero initialPlays={49631} />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    await act(async () => {});

    expect(factTexts()[0]).toEqual(["49,631", "49,631games played"]);
  });

  it("holds the slot with the label and a placeholder while the count loads", () => {
    renderWithIntl(<LabHero />);

    expect(factTexts()[0]).toEqual(["–", "–games played"]);
    expect(document.querySelector(".lab-fact-lead")).toHaveAttribute("aria-busy", "true");
  });

  it("keeps the placeholder when the count is unavailable", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false });
    renderWithIntl(<LabHero />);

    await statsRow().findByText("games played");
    await screen.findByText((_, element) => element?.getAttribute("data-status") === "unavailable");
    expect(factTexts()[0]).toEqual(["–", "–games played"]);
    expect(factTexts()).toHaveLength(4);
  });

  it("words a count of one in the singular", () => {
    renderWithIntl(<LabHero initialPlays={1} />);

    expect(factTexts()[0]).toEqual(["1", "1game played"]);
  });

  it("writes the count the way the page's language writes numbers", () => {
    renderWithIntl(<LabHero initialPlays={46543} />, { locale: "de", messages: de });

    expect(factTexts()[0]).toEqual(["46.543", "46.543gespielte Partien"]);
  });
});
