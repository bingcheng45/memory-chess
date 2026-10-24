import { act, fireEvent, render, screen, within } from "@/test-utils/intl";
import GamePage from "@/app/[locale]/game/page";
import { useGameStore } from "@/lib/store/gameStore";

jest.mock("@/lib/utils/soundEffects", () => ({
  ...jest.requireActual("@/lib/utils/soundEffects"),
  playSound: jest.fn(),
  stopTimerSound: jest.fn(),
}));

jest.mock("@/i18n/navigation", () => ({
  usePathname: () => "/game",
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));

afterEach(() => {
  act(() => useGameStore.getState().resetGame());
  localStorage.clear();
});

/** Each button's name and whether it is enabled, palette pieces left out. */
const buttonsIn = (label: string) =>
  within(screen.getByRole("region", { name: label }))
    .getAllByRole("button")
    .filter((button) => !button.closest(".lab-palette"))
    .map((button) => [button.getAttribute("aria-label") ?? button.textContent, !(button as HTMLButtonElement).disabled]);

const placement = () => ({ status: buttonsIn("Game status"), controls: buttonsIn("Game controls") });

describe("the round's controls on /game", () => {
  it("keeps one primary beside the palette and moves Restart to the status row, in every phase", () => {
    render(<GamePage />);
    fireEvent.click(screen.getByRole("button", { name: "Start round" }));
    const counting = placement();
    act(() => useGameStore.getState().endCountdown());
    const studying = placement();
    fireEvent.click(screen.getByRole("button", { name: "Hide board" }));
    const rebuilding = placement();

    expect(counting).toEqual({
      status: [["Leave the round", true], ["Clear board", false]],
      controls: [["Hide board", false]],
    });
    expect(studying).toEqual({
      status: [["Leave the round", true], ["Clear board", false]],
      controls: [["Hide board", true]],
    });
    expect(rebuilding).toEqual({
      status: [["Leave the round", true], ["Restart", true], ["Clear board", true]],
      controls: [["Submit", true]],
    });
  });

  it("restarts the round from the status row's icon", () => {
    render(<GamePage />);
    fireEvent.click(screen.getByRole("button", { name: "Start round" }));
    act(() => useGameStore.getState().endCountdown());
    fireEvent.click(screen.getByRole("button", { name: "Hide board" }));

    fireEvent.click(screen.getByRole("button", { name: "Restart" }));

    expect(useGameStore.getState().round.phase).toBe("countdown");
  });
});
