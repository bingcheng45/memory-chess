import { act, fireEvent } from "@testing-library/react";
import { renderWithIntl, screen, within } from "@/test-utils/intl";
import { Dashboard } from "@/components/dashboard/Dashboard";
import type { LabData } from "@/hooks/useLabData";
import { persona } from "@/test-utils/labPersona";
import type { PersonaName } from "@/lib/lab/personas";

jest.mock("@/lib/analytics/events", () => ({ ...jest.requireActual("@/lib/analytics/events"), trackEvent: jest.fn() }));
jest.mock("@/components/dashboard/shareImage", () => ({ drawShareCard: () => Promise.resolve(new Blob(["png"], { type: "image/png" })) }));

let labData: LabData;
jest.mock("@/hooks/useLabData", () => ({
  ...jest.requireActual("@/hooks/useLabData"),
  useLabData: () => labData,
}));

const show = (name: PersonaName) => {
  labData = persona(name);
  return renderWithIntl(<Dashboard />);
};
const tileText = (id: string) => document.querySelector(`[data-tile="${id}"]`)?.textContent;

beforeEach(() => window.localStorage.clear());

describe("Dashboard", () => {
  it("offers the share card once a headline figure is ready, with the caption it will post", async () => {
    URL.createObjectURL = jest.fn(() => "blob:card");
    URL.revokeObjectURL = jest.fn();
    show("threeDays");

    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Share my progress" })));
    expect(within(screen.getByRole("dialog")).getByText(/^My Memory Chess progress/).textContent).toBe(
      "My Memory Chess progress: memory span 6 pieces, 5.3 pieces held, 4.6 s per piece, 100% best accuracy. Can you beat it? https://thememorychess.com/share/progress/1_s6_h53_v46_b100_a89_m13_t41_k3_n12_d3?utm_source=share&utm_medium=dashboard",
    );
    expect(tileText("span")).toBe("Memory span6 pieces80% or better in 11 rounds, studied 10 s");
    expect(tileText("studyTime")).toBe("Study time1.3 s per pieceAverage of your last 12 rounds, any setting");
    expect(tileText("rebuildTime")).toBe("Rebuild time4.1 s per pieceAverage of your last 12 rounds, any setting");
  });

  it("lists every round of the record, newest first, and opens a round's scored board", () => {
    show("threeDays");

    expect(document.querySelector("[data-history-count]")?.textContent).toBe("Showing 12 of 12 rounds");
    const rows = document.querySelectorAll("[data-history-row]");
    expect(rows).toHaveLength(12);
    const first = within(rows[0] as HTMLElement);
    expect([...rows[0].querySelectorAll("td[data-label]")].map((cell) => `${cell.getAttribute("data-label")}: ${cell.textContent}`).slice(4, 7)).toEqual([
      "Correct: 5 of 6",
      "Study time: 10.0 s",
      "Rebuild time: 26.8 s",
    ]);
    fireEvent.click(first.getByRole("button", { name: "Show board" }));
    expect(first.getByRole("button", { name: "Hide board" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("figure", { name: /^Scored board: \d+ of \d+ pieces right\.$/ })).toBeInTheDocument();
  });

  it("shows twenty rounds at first and twenty more on request, and filters by setting", () => {
    show("thirtyDays");

    expect(document.querySelectorAll("[data-history-row]")).toHaveLength(20);
    expect(document.querySelector("[data-history-count]")?.textContent).toBe("Showing 20 of 90 rounds");
    fireEvent.click(screen.getByRole("button", { name: "Show 20 more" }));
    expect(document.querySelectorAll("[data-history-row]")).toHaveLength(40);

    const setting = screen.getByRole("combobox", { name: "Setting" });
    fireEvent.change(setting, { target: { value: (within(setting).getAllByRole("option")[1] as HTMLOptionElement).value } });
    const shown = document.querySelector("[data-history-count]")?.textContent ?? "";
    expect(shown).toMatch(/^Showing \d+ of \d+ rounds?$/);
    expect(shown).not.toBe("Showing 20 of 90 rounds");
  });

  it("explains an empty record and offers a first round instead of an empty table", () => {
    show("newVisitor");

    expect(screen.getByText("No rounds yet.")).toBeInTheDocument();
    expect(document.querySelectorAll("[data-history-row]")).toHaveLength(0);
  });

  it("swaps the share button for a first round before any round is played", () => {
    show("newVisitor");

    expect(screen.queryByRole("button", { name: "Share my progress" })).toBeNull();
    expect(screen.getByText("After your first round, your card shows your best figures here.")).toBeInTheDocument();
  });

  it("shares the figures that are ready while the headline figures still warm", async () => {
    URL.createObjectURL = jest.fn(() => "blob:card");
    URL.revokeObjectURL = jest.fn();
    show("twoRounds");

    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Share my progress" })));
    expect(within(screen.getByRole("dialog")).getByText(/^My Memory Chess progress/).textContent).toBe(
      "My Memory Chess progress: 83% best accuracy, 67% recent accuracy, study time 1.1 s per piece, rebuild time 4.8 s per piece. Can you beat it? https://thememorychess.com/share/progress/1_b83_a67_m11_t48_n2_d1?utm_source=share&utm_medium=dashboard",
    );
  });

  it("gives each tile the fragment a Learn guide links to", () => {
    show("twoRounds");

    expect(document.getElementById("tile-recentAccuracy")?.textContent).toBe(tileText("recentAccuracy"));
    expect(document.getElementById("tile-recentAccuracy")?.textContent).toMatch(/^Recent accuracy/);
  });

  it("names what a warming figure still needs", () => {
    show("twoRounds");

    const speed = document.querySelector<HTMLElement>('[data-tile="speed"]');
    expect(speed?.textContent).toBe("SpeedUnlocks with 4 more rounds at 6 pieces, 10 s.Play 6 pieces, 10 s →");
    expect(within(speed as HTMLElement).getByRole("link")).toHaveAttribute("href", "/game?pieceCount=6&memorizeTime=10&source=dashboard");
  });

  it("names every missing piece of a warming figure and links the full record for a choice", () => {
    show("twoRounds");

    expect(tileText("piecesHeld")).toBe("Pieces heldUnlocks with 3 more rounds and 1 more day of play.Play a round →");
    expect(within(document.querySelector('[data-tile="plans"]') as HTMLElement).getByRole("link")).toHaveAttribute("href", "/#record");
  });

  it("asks a player who already played today to come back tomorrow for a figure that needs only another day", () => {
    show("twoRounds");

    expect(tileText("streak")).toBe("Day streakUnlocks with 1 more day of play.Come back tomorrow.");
    expect(within(document.querySelector('[data-tile="streak"]') as HTMLElement).queryByRole("link")).toBeNull();
    expect(within(document.querySelector('[data-tile="piecesHeld"]') as HTMLElement).getByRole("link")).toHaveAttribute("href", "/game?pieceCount=6&memorizeTime=10&source=dashboard");
  });

  it("holds the stale note's row open before the record loads, so the note fills it instead of arriving", () => {
    labData = { ...persona("stale"), storage: "loading", records: [], today: "" };
    const { rerender } = renderWithIntl(<Dashboard />);
    expect(document.querySelector("header .lab-dash-notes")?.textContent).toBe("");

    labData = persona("stale");
    rerender(<Dashboard />);
    expect(document.querySelector("header .lab-dash-notes")?.textContent).toBe("Last played 20 days ago. Figures marked so are from then.");
  });

  it.each([
    ["en", "Longest streak: 3 days"],
    ["cs", "Nejdelší série: 3 dny"],
    ["da", "Længste stime: 3 dage"],
    ["de", "Längste Serie: 3 Tage"],
    ["es", "Racha más larga: 3 días"],
    ["fi", "Pisin putki: 3 päivää"],
    ["fr", "Plus longue série : 3 jours"],
    ["hi", "सबसे लंबा सिलसिला: 3 दिन"],
    ["hu", "Leghosszabb sorozat: 3 nap"],
    ["id", "Beruntun terpanjang: 3 hari"],
    ["it", "Serie più lunga: 3 giorni"],
    ["ja", "最長連続3日"],
    ["ko", "최장 연속 3일"],
    ["nl", "Langste reeks: 3 dagen"],
    ["no", "Lengste rekke: 3 dager"],
    ["pl", "Najdłuższa seria: 3 dni"],
    ["pt-BR", "Maior sequência: 3 dias"],
    ["ro", "Cea mai lungă serie: 3 zile"],
    ["ru", "Самая длинная серия: 3 дня"],
    ["sv", "Längsta svit: 3 dagar"],
    ["tr", "En uzun seri: 3 gün"],
    ["vi", "Chuỗi dài nhất: 3 ngày"],
    ["zh-CN", "最长连续 3 天"],
    ["zh-TW", "最長連續 3 天"],
  ])("names the streak the longest run belongs to in %s", async (locale, longest) => {
    labData = persona("threeDays");
    const { default: messages } = await import(`../../../../messages/${locale}.json`);
    renderWithIntl(<Dashboard />, { locale, messages });

    expect(document.querySelector('[data-tile="streak"] .lab-tile-note')?.textContent).toBe(longest);
  });
});
