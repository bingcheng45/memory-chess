import { render, screen, fireEvent, waitFor } from "@/test-utils/intl";
import { LeaderboardTabs, type LeaderboardBoards } from "@/components/leaderboard/LeaderboardTabs";

const boards: LeaderboardBoards = {
  easy: { data: [] },
  medium: { data: [] },
  hard: { data: [] },
  grandmaster: { data: [] },
};

describe("LeaderboardTabs keyboard access", () => {
  it("makes the active tab the one tab stop on first render", () => {
    render(<LeaderboardTabs boards={boards} initialTab="medium" />);

    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((tab) => [tab.textContent, tab.getAttribute("tabindex")])).toEqual([
      ["Easy", "-1"],
      ["Medium", "0"],
      ["Hard", "-1"],
      ["Grandmaster", "-1"],
    ]);
  });

  it("moves to the next tab with ArrowRight and makes it the tab stop", async () => {
    render(<LeaderboardTabs boards={boards} initialTab="medium" />);
    const medium = screen.getByRole("tab", { name: "Medium" });
    const hard = screen.getByRole("tab", { name: "Hard" });

    medium.focus();
    fireEvent.keyDown(medium, { key: "ArrowRight" });

    await waitFor(() => expect(hard).toHaveFocus());
    expect(hard).toHaveAttribute("data-state", "active");
    expect(hard).toHaveAttribute("tabindex", "0");
    expect(medium).toHaveAttribute("tabindex", "-1");
  });
});
