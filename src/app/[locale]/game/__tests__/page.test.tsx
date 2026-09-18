import { render } from "@/test-utils/intl";
import GamePage from "@/app/[locale]/game/page";

const mockStartGame = jest.fn();
const mockAnalytics = {
  trackFeatureUsage: jest.fn(),
  trackGameStart: jest.fn(),
  track: jest.fn(),
  trackGameComplete: jest.fn(),
  trackDailyChallengeComplete: jest.fn(),
};

jest.mock("@/lib/store/gameStore", () => ({
  useGameStore: () => ({
    gameState: { isPlaying: false, isMemorizationPhase: false, isSolutionPhase: false },
    gamePhase: "configuration",
    startGame: mockStartGame,
    resetGame: jest.fn(),
    startMemorizationPhase: jest.fn(),
    endMemorizationPhase: jest.fn(),
    startSolutionPhase: jest.fn(),
    submitSolution: jest.fn(),
    calculateSkillRatingChange: jest.fn(),
    placePiece: jest.fn(),
    removePiece: jest.fn(),
    chess: null,
  }),
}));

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
}));

jest.mock("@/components/ui/PageHeader", () => {
  function MockPageHeader() {
    return <div />;
  }
  return MockPageHeader;
});

beforeEach(() => {
  jest.spyOn(console, "log").mockImplementation(() => {});
  mockStartGame.mockClear();
  mockAnalytics.trackGameStart.mockClear();
});

afterEach(() => {
  window.history.pushState({}, "", "/");
  jest.restoreAllMocks();
});

describe("GamePage URL-driven start", () => {
  it("auto-starts the round a drill link names", () => {
    window.history.pushState({}, "", "/game?pieceCount=12&memorizeTime=8");

    render(<GamePage />);

    expect(mockStartGame).toHaveBeenCalledWith(12, 8);
    expect(mockAnalytics.trackGameStart).toHaveBeenCalledWith(12, 8, false);
  });

  it("flags a challenge link as a challenge start", () => {
    window.history.pushState({}, "", "/game?pieceCount=6&challenge=2026-09-16");

    render(<GamePage />);

    expect(mockStartGame).toHaveBeenCalledWith(6, 10);
    expect(mockAnalytics.trackGameStart).toHaveBeenCalledWith(6, 10, true);
  });

  it("waits on the configuration form without round params", () => {
    window.history.pushState({}, "", "/game?difficulty=hard");

    render(<GamePage />);

    expect(mockStartGame).not.toHaveBeenCalled();
  });
});
