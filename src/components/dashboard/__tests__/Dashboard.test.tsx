import { fireEvent } from "@testing-library/react";
import { renderWithIntl, screen, within } from "@/test-utils/intl";
import { Dashboard } from "@/components/dashboard/Dashboard";
import type { LabData } from "@/hooks/useLabData";
import { persona } from "@/test-utils/labPersona";
import type { PersonaName } from "@/lib/lab/personas";

jest.mock("@/lib/analytics/events", () => ({ trackEvent: jest.fn() }));

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
  it("offers the share card once a headline figure is ready, with the caption it will post", () => {
    show("threeDays");

    expect(screen.getByRole("button", { name: "Share my progress" })).toBeInTheDocument();
    expect(document.querySelector(".lab-share-caption pre")?.textContent).toBe(
      "My Memory Chess progress: memory span 6 pieces, 5.2 pieces held, 4.6 s per piece, 3 days in a row. Can you beat it? https://thememorychess.com/?utm_source=share&utm_medium=dashboard",
    );
    expect(tileText("span")).toBe("Memory span6 pieces80% or better in 11 rounds, studied 10 s");
  });

  it("lists every round of the record, newest first, and opens a round's scored board", () => {
    show("threeDays");

    expect(document.querySelector("[data-history-count]")?.textContent).toBe("Showing 12 of 12 rounds");
    const rows = document.querySelectorAll("[data-history-row]");
    expect(rows).toHaveLength(12);
    const first = within(rows[0] as HTMLElement);
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

  it("swaps the share button for a round while every headline figure is still warming", () => {
    show("twoRounds");

    expect(screen.queryByRole("button", { name: "Share my progress" })).toBeNull();
    expect(screen.getByText("Your share card unlocks once memory span, skill rating, pieces held, speed or your day streak is ready.")).toBeInTheDocument();
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
