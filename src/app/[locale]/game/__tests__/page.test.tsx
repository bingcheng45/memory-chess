import { render } from "@/test-utils/intl";
import GamePage from "@/app/[locale]/game/page";

const mockStartGame = jest.fn();
let mockGamePhase = "configuration";

jest.mock("@/lib/store/gameStore", () => {
  const mockState = () => ({
    gameState: { isPlaying: false, isMemorizationPhase: false, isSolutionPhase: false },
    gamePhase: mockGamePhase,
    lastSettings: null,
    startGame: mockStartGame,
    resetGame: jest.fn(),
    startMemorizationPhase: jest.fn(),
    endMemorizationPhase: jest.fn(),
    startSolutionPhase: jest.fn(),
    submitSolution: jest.fn(),
    placePiece: jest.fn(),
    removePiece: jest.fn(),
    chess: null,
  });
  return {
    useGameStore: (selector?: (state: ReturnType<typeof mockState>) => unknown) =>
      selector ? selector(mockState()) : mockState(),
  };
});

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
  function MockPageHeader({ pageType }: { pageType?: string }) {
    return <div data-page-type={pageType} />;
  }
  return MockPageHeader;
});

beforeEach(() => {
  jest.spyOn(console, "log").mockImplementation(() => {});
  mockStartGame.mockClear();
});

afterEach(() => {
  mockGamePhase = "configuration";
  window.history.pushState({}, "", "/");
  jest.restoreAllMocks();
});

describe("GamePage URL-driven start", () => {
  it("auto-starts the round a drill link names", () => {
    window.history.pushState({}, "", "/game?pieceCount=12&memorizeTime=8");

    render(<GamePage />);

    expect(mockStartGame).toHaveBeenCalledWith(12, 8);
  });

  it("starts a challenge link with the default memorize time", () => {
    window.history.pushState({}, "", "/game?pieceCount=6&challenge=2026-09-16");

    render(<GamePage />);

    expect(mockStartGame).toHaveBeenCalledWith(6, 10);
  });

  it("waits on the configuration form without round params", () => {
    window.history.pushState({}, "", "/game?difficulty=hard");

    render(<GamePage />);

    expect(mockStartGame).not.toHaveBeenCalled();
  });
});

describe("GamePage header", () => {
  it.each([
    ["configuration", "other"],
    ["memorization", "game-memorize-solution"],
    ["solution", "game-memorize-solution"],
    ["result", "other"],
  ])("in the %s phase asks the header for %s", (phase, pageType) => {
    mockGamePhase = phase;

    const { container } = render(<GamePage />);

    expect(container.querySelector("[data-page-type]")).toHaveAttribute("data-page-type", pageType);
  });
});
