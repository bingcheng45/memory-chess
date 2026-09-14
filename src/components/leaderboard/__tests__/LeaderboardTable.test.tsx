import { render } from "@/test-utils/intl";
import LeaderboardTable, { TimeDisplay } from "@/components/leaderboard/LeaderboardTable";

const textOf = (seconds: number) =>
  render(<TimeDisplay seconds={seconds} />).container.textContent;

describe("TimeDisplay", () => {
  it("shows a sub-second look as milliseconds, not as hundreds of seconds", () => {
    expect(textOf(0.648)).toBe("00:00:648");
  });

  it("keeps whole seconds and rounds away floating-point noise", () => {
    expect(textOf(8.558)).toBe("00:08:558");
    expect(textOf(95.072)).toBe("01:35:072");
  });
});

describe("LeaderboardTable", () => {
  it("dates a row in UTC so the server and the browser print the same day", () => {
    const { container } = render(
      <LeaderboardTable
        error={null}
        activeTab="medium"
        data={[
          {
            id: "row-1",
            player_name: "Dino beta",
            difficulty: "medium",
            piece_count: 6,
            correct_pieces: 6,
            memorize_time: 0.648,
            solution_time: 18.887,
            created_at: "2026-08-04T23:49:31.839+00:00",
            total_wrong_pieces: 0,
          },
        ]}
      />,
    );

    expect(container.textContent).toContain("Aug 4, 2026");
    expect(container.textContent).toContain("00:00:648");
  });
});
