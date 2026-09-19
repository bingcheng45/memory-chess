import { act, fireEvent, render, screen } from "@/test-utils/intl";
import GamePage from "@/app/[locale]/game/page";
import { useGameStore } from "@/lib/store/gameStore";

const mockAnalytics = {
  trackFeatureUsage: jest.fn(),
  trackGameStart: jest.fn(),
  track: jest.fn(),
  trackGameComplete: jest.fn(),
  trackDailyChallengeComplete: jest.fn(),
};

jest.mock("@/lib/utils/analyticsTracker", () => ({
  useAnalytics: () => mockAnalytics,
  AnalyticsEventType: {},
}));

jest.mock("@/lib/utils/soundEffects", () => ({
  playSound: jest.fn(),
  stopTimerSound: jest.fn(),
}));

jest.mock("@/hooks/useSoundEffects", () => ({
  useSoundEffects: jest.fn(),
}));

jest.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));

jest.mock("@/components/ui/PageHeader", () => {
  function MockPageHeader() {
    return <div />;
  }
  return MockPageHeader;
});

jest.mock("@/components/game/ResponsiveMemorizationBoard", () => {
  function MockMemorizationBoard() {
    return <div />;
  }
  return MockMemorizationBoard;
});

jest.mock("@/components/game/ResponsiveInteractiveBoard", () => {
  function MockInteractiveBoard() {
    return <div />;
  }
  return MockInteractiveBoard;
});

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
    fireEvent.click(screen.getByRole("button", { name: "Start Training" }));
    act(() => {
      const store = useGameStore.getState();
      store.endMemorizationPhase();
      store.startSolutionPhase();
      store.submitSolution(5);
    });
    fireEvent.click(screen.getByRole("button", { name: "New Game" }));

    expect(screen.getByRole("button", { name: /Hard/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /Medium/ })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByLabelText("Number of Pieces")).toHaveValue("12");
    expect(screen.getByLabelText("Memorization Time")).toHaveValue("8");
  });
});
