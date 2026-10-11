import { renderWithIntl, screen, within } from "@/test-utils/intl";
import { ProgressDashboard } from "@/components/dashboard/ProgressDashboard";
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
  return renderWithIntl(<ProgressDashboard />);
};
const tileText = (id: string) => document.querySelector(`[data-tile="${id}"]`)?.textContent;

beforeEach(() => window.localStorage.clear());

describe("ProgressDashboard", () => {
  it("offers the share card once a headline figure is ready, with the caption it will post", () => {
    show("threeDays");

    expect(screen.getByRole("button", { name: "Share my progress" })).toBeInTheDocument();
    expect(document.querySelector(".lab-share-caption pre")?.textContent).toBe(
      "My Memory Chess progress: memory span 6 pieces, 5.2 pieces held, 4.6 s per piece, 3 days in a row. Can you beat it? https://thememorychess.com/?utm_source=share&utm_medium=dashboard",
    );
    expect(tileText("span")).toBe("Memory span6 pieces80% or better in 11 rounds, studied 10 s");
  });

  it("draws no insights tile, not even a loading one, while the record has no finding", () => {
    show("spanClimber");

    expect(document.querySelector('[data-tile="insights"]')).toBeNull();
    expect(document.querySelectorAll('[data-state="loading"]')).toHaveLength(0);
  });

  it("swaps the share button for a round while every headline figure is still warming", () => {
    show("twoRounds");

    expect(screen.queryByRole("button", { name: "Share my progress" })).toBeNull();
    expect(screen.getByText("Your share card unlocks once memory span, pieces held, speed or your streak is ready.")).toBeInTheDocument();
    const speed = document.querySelector<HTMLElement>('[data-tile="speed"]');
    expect(speed?.textContent).toBe("SpeedUnlocks with 4 more rounds at 6 pieces, 10 s.Play 6 pieces, 10 s →");
    expect(within(speed as HTMLElement).getByRole("link")).toHaveAttribute("href", "/game?pieceCount=6&memorizeTime=10&source=dashboard");
  });

  it("names every missing piece of a warming figure and links the full record for a choice", () => {
    show("twoRounds");

    expect(tileText("piecesHeld")).toBe("Pieces heldUnlocks with 3 more rounds and 1 more day of play.Play a round →");
    expect(within(document.querySelector('[data-tile="plans"]') as HTMLElement).getByRole("link")).toHaveAttribute("href", "/#record");
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
    renderWithIntl(<ProgressDashboard />, { locale, messages });

    expect(document.querySelector('[data-tile="streak"] .lab-note')?.textContent).toBe(longest);
  });
});
