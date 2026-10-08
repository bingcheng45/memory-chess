import { render } from "@/test-utils/intl";
import GamePage from "@/app/[locale]/game/page";

const mockStartGame = jest.fn();
const mockResetGame = jest.fn();
let mockGamePhase = "configuration";

jest.mock("@/lib/store/gameStore", () => {
  const mockState = () => ({
    gameState: { isPlaying: false, isMemorizationPhase: false, isSolutionPhase: false },
    gamePhase: mockGamePhase,
    lastSettings: null,
    startGame: mockStartGame,
    resetGame: mockResetGame,
    startMemorizationPhase: jest.fn(),
    endMemorizationPhase: jest.fn(),
    startSolutionPhase: jest.fn(),
    submitSolution: jest.fn(),
    placePiece: jest.fn(),
    removePiece: jest.fn(),
    chess: null,
  });
  const useGameStore = (selector?: (state: ReturnType<typeof mockState>) => unknown) =>
    selector ? selector(mockState()) : mockState();
  useGameStore.getState = mockState;
  return { useGameStore };
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
  mockResetGame.mockClear();
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

    expect(mockStartGame).toHaveBeenCalledWith(12, 8, "link");
  });

  it("starts a challenge link with the default memorize time", () => {
    window.history.pushState({}, "", "/game?pieceCount=6&challenge=2026-09-16");

    render(<GamePage />);

    expect(mockStartGame).toHaveBeenCalledWith(6, 10, "link");
  });

  it("clears the round params from the address after the URL start", () => {
    window.history.pushState({}, "", "/game?pieceCount=6&memorizeTime=10");

    render(<GamePage />);

    expect(mockStartGame).toHaveBeenCalledWith(6, 10, "link");
    expect(window.location.pathname + window.location.search).toBe("/game");
  });

  it("keeps other params when it clears the round params", () => {
    window.history.pushState({}, "", "/game?pieceCount=6&challenge=2026-09-16");

    render(<GamePage />);

    expect(window.location.search).toBe("?challenge=2026-09-16");
  });

  it("starts the round with the source its link names and clears that from the address", () => {
    window.history.pushState({}, "", "/game?pieceCount=12&memorizeTime=8&source=guide_cta");

    render(<GamePage />);

    expect(mockStartGame).toHaveBeenCalledWith(12, 8, "guide_cta");
    expect(window.location.pathname + window.location.search).toBe("/game");
  });

  it("reads an unknown source as a plain link", () => {
    window.history.pushState({}, "", "/game?pieceCount=12&memorizeTime=8&source=newsletter%3Cx%3E");

    render(<GamePage />);

    expect(mockStartGame).toHaveBeenCalledWith(12, 8, "link");
  });

  it("waits on the configuration form without round params", () => {
    window.history.pushState({}, "", "/game?difficulty=hard");

    render(<GamePage />);

    expect(mockStartGame).not.toHaveBeenCalled();
  });

  it("leaves the address alone without round params", () => {
    window.history.pushState({}, "", "/game?difficulty=hard");

    render(<GamePage />);

    expect(window.location.search).toBe("?difficulty=hard");
  });
});

describe("GamePage URL-driven start under StrictMode", () => {
  it("starts the round after the remount's reset and clears the address", () => {
    window.history.pushState({}, "", "/game?pieceCount=6&memorizeTime=10");

    render(<GamePage />, { reactStrictMode: true });

    const lastStart = Math.max(...mockStartGame.mock.invocationCallOrder);
    const lastReset = Math.max(0, ...mockResetGame.mock.invocationCallOrder);
    expect(mockStartGame).toHaveBeenLastCalledWith(6, 10, "link");
    expect(lastStart).toBeGreaterThan(lastReset);
    expect(window.location.pathname + window.location.search).toBe("/game");
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

describe("GamePage pinning", () => {
  it("pins the page before the board first measures its room, so the board is never laid out on the unpinned page", () => {
    mockGamePhase = "memorization";
    const pinnedAtEachMeasure: boolean[] = [];
    jest.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(() => {
      pinnedAtEachMeasure.push(document.body.classList.contains("game-fixed"));
      return { width: 400, height: 600 } as DOMRect;
    });

    render(<GamePage />);

    expect(pinnedAtEachMeasure.length > 0 && pinnedAtEachMeasure.every(Boolean)).toBe(true);
  });

  it("unpins the page when the round leaves the board", () => {
    mockGamePhase = "memorization";
    const { rerender } = render(<GamePage />);

    mockGamePhase = "result";
    rerender(<GamePage />);

    expect([document.documentElement.className, document.body.className]).toEqual(["", ""]);
  });
});
