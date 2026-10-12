import { render, screen, within } from "@/test-utils/intl";
import ResultDeltas from "@/components/game/ResultDeltas";
import { useLabData } from "@/hooks/useLabData";
import { roundV2 } from "@/lib/lab/__tests__/fixtures";
import type { RoundRecord } from "@/lib/lab/record";
import { summarize } from "@/lib/lab/summary";
import { useGameStore } from "@/lib/store/gameStore";
import type { GameHistory } from "@/lib/types/game";

jest.mock("@/hooks/useLabData", () => {
  const actual = jest.requireActual("@/hooks/useLabData");
  return { ...actual, useLabData: jest.fn() };
});

const TODAY = "2026-10-07";
const FIVE = "4k3/8/8/3q4/8/5N2/3P4/4K3";
const at = (localDay: string, hour: number) => ({ endedAt: Date.parse(`${localDay}T${String(hour).padStart(2, "0")}:00:00Z`), localDay });

function withRecord(records: readonly RoundRecord[]) {
  jest.mocked(useLabData).mockReturnValue({ storage: "available", records, summary: summarize(records), lastBackup: null, today: TODAY });
}

const rated = (id: string, skillRatingChange: number) => ({ id, skillRatingChange }) as GameHistory;

function afterRound(id: string, standing: { rating: number; streak: number; before: { skillRating: number; streak: number }; history: GameHistory[] }) {
  useGameStore.setState(({ gameState }) => ({
    gameState: { ...gameState, skillRating: standing.rating, streak: standing.streak, standingBefore: standing.before },
    history: standing.history,
  }));
  render(<ResultDeltas roundId={id} />);
  return screen.getByRole("region", { name: "Your dashboard after this round" });
}

const rows = (section: HTMLElement) => within(section).getAllByRole("listitem");
const said = (section: HTMLElement) => rows(section).map((row) => row.querySelector(".lab-sr")?.textContent);
const row = (section: HTMLElement, figure: string) => section.querySelector(`[data-figure="${figure}"]`) as HTMLElement;
const shown = (section: HTMLElement, figure: string) => row(section, figure).querySelector("[aria-hidden=\"true\"]")?.textContent;

describe("ResultDeltas", () => {
  it("says every figure a round moved, with its value, the change, where it came from and whether that is better", () => {
    withRecord([
      roundV2({ id: "a", ...at("2026-10-06", 9) }),
      roundV2({ id: "b", ...at("2026-10-06", 10) }),
      roundV2({ id: "c", ...at("2026-10-06", 11), pieceCount: 5, targetFen: FIVE, placedFen: FIVE }),
      roundV2({ id: "d", ...at(TODAY, 12), pieceCount: 5, targetFen: FIVE, placedFen: FIVE }),
    ]);

    const section = afterRound("d", { rating: 1058, streak: 3, before: { skillRating: 1040, streak: 2 }, history: [rated("d", 18), rated("c", 10)] });

    expect(said(section)).toEqual([
      "Skill rating 1,058, up 18 from 1,040, better",
      "Memory span 5 pieces, up 1 from 4 pieces, better",
      "Best accuracy 100%, no change",
      "Recent accuracy 100%, no change",
      "Win streak 3 rounds, up 1 from 2 rounds, better",
      "Day streak 2 days, new",
      "Rounds played 4 rounds, up 1 from 3 rounds, better",
      "Days played 2 days, up 1 from 1 day, better",
    ]);
    expect(row(section, "span").querySelector('[data-tone="better"] [data-arrow="up"]')).not.toBeNull();
    expect(shown(section, "streak")).toBe("Day streak2 daysNew");
    expect(within(section).getByRole("link", { name: "Open your dashboard" })).toHaveAttribute("href", "/dashboard");
  });

  it("marks what an empty board lowered in red with a down arrow, and a level figure with words, not a chip", () => {
    const earlier = [roundV2({ id: "a", ...at("2026-10-06", 9) }), roundV2({ id: "b", ...at(TODAY, 9) }), roundV2({ id: "c", ...at(TODAY, 10) })];
    withRecord([...earlier, roundV2({ id: "d", ...at(TODAY, 12), placedFen: "8/8/8/8/8/8/8/8" })]);

    const section = afterRound("d", { rating: 1080, streak: 0, before: { skillRating: 1100, streak: 3 }, history: [rated("d", -20), rated("c", 9)] });

    expect([row(section, "rating"), row(section, "winStreak"), row(section, "recentAccuracy")].map((item) => item.querySelector(".lab-sr")?.textContent)).toEqual([
      "Skill rating 1,080, down 20 from 1,100, worse",
      "Win streak 0 rounds, down 3 from 3 rounds, worse",
      "Recent accuracy 75%, down 25 from 100%, worse",
    ]);
    expect(row(section, "winStreak").querySelector('[data-tone="worse"] [data-arrow="down"]')?.parentElement?.textContent).toBe("3");
    expect(shown(section, "bestAccuracy")).toBe("Best accuracy100%No change");
    expect(row(section, "bestAccuracy").querySelector(".lab-trend")).toBeNull();
  });

  it("shows faster rebuilding as better in green with a down arrow and the size of its fall", () => {
    const earlier = [9, 10, 11, 12, 13].map((hour) => roundV2({ id: `s${hour}`, ...at(TODAY, hour), solveMs: 20000 }));
    withRecord([...earlier, roundV2({ id: "fast", ...at(TODAY, 14), solveMs: 8000 })]);

    const speed = row(afterRound("fast", { rating: 1100, streak: 6, before: { skillRating: 1090, streak: 5 }, history: [rated("fast", 10)] }), "speed");

    expect(speed.querySelector(".lab-sr")?.textContent).toBe("Speed 4.5 s per piece, down 0.5 from 5.0 s per piece, better");
    expect(speed.dataset.verdict).toBe("better");
    expect(speed.querySelector(".lab-trend")?.getAttribute("data-tone")).toBe("better");
    expect(speed.querySelector(".lab-trend")?.textContent).toBe("0.5");
    expect(speed.querySelector(".lab-trend svg")?.getAttribute("data-arrow")).toBe("down");
  });

  it("draws nothing until the round is in the record", () => {
    withRecord([roundV2({ id: "a", ...at(TODAY, 9) })]);

    render(<ResultDeltas roundId="missing" />);

    expect(screen.queryByRole("region")).toBeNull();
  });
});
