import { act, fireEvent, render, screen } from "@/test-utils/intl";
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

beforeEach(() => {
  jest.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  useGameStore.getState().resetGame();
  useGameStore.setState({ lastSettings: null });
  localStorage.clear();
  jest.restoreAllMocks();
});

describe("GamePage new game after a round", () => {
  it("reopens the configuration on the settings just played", () => {
    render(<GamePage />);

    fireEvent.click(screen.getByRole("button", { name: /Hard/ }));
    fireEvent.click(screen.getByRole("button", { name: "Start round" }));
    act(() => useGameStore.getState().endCountdown());
    fireEvent.click(screen.getByRole("button", { name: "Hide board" }));
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    fireEvent.click(screen.getByRole("button", { name: "Change settings" }));

    expect(screen.getByRole("button", { name: /Hard/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /Medium/ })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByLabelText("Number of pieces")).toHaveTextContent("12");
    expect(screen.getByLabelText("Memorization time")).toHaveTextContent("8s");
  });
});
