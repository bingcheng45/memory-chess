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
});
