import type { ReactNode } from "react";
import { act, fireEvent, render, screen, waitFor } from "@/test-utils/intl";
import { openDaily, type DailyStart } from "@/lib/lab/dailyBoard";
import GamePage from "@/app/[locale]/game/page";
import { fakeLayout } from "@/test-utils/layout";

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

jest.mock("@/lib/lab/dailyBoard", () => ({ openDaily: jest.fn() }));

jest.mock("@/lib/utils/soundEffects", () => ({
  playSound: jest.fn(),
  stopTimerSound: jest.fn(),
}));

jest.mock("@/hooks/useSoundEffects", () => ({
  useSoundEffects: jest.fn(),
}));

jest.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  Link: ({ href, children, className }: { href: string; children: ReactNode; className?: string }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
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
  jest.mocked(openDaily).mockReset();
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

describe("GamePage daily board link", () => {
  const BOARD = { kind: "daily", day: "2026-10-09", fen: "8/8/8/1pQ4k/P2p4/8/8/1K6 b - - 0 1" } as const;
  const opens = (daily: DailyStart) => jest.mocked(openDaily).mockResolvedValue(daily);

  it("plays today's set board at the setting the board names, whatever the link says", async () => {
    opens({ kind: "play", pieceCount: 6, memorizeTime: 10, board: BOARD });
    window.history.pushState({}, "", "/game?pieceCount=12&memorizeTime=8&source=daily");

    render(<GamePage />);

    await waitFor(() => expect(mockStartGame).toHaveBeenCalledWith(6, 10, "daily", BOARD));
    expect(window.location.search).toBe("");
  });

  it("refuses a second attempt today with a message in the form's place, until the player chooses a round", async () => {
    opens({ kind: "played" });
    window.history.pushState({}, "", "/game?pieceCount=6&memorizeTime=10&source=daily");

    render(<GamePage />);

    expect(await screen.findByText("You have already opened today's board. One try per day on this device.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open your lab record" })).toHaveAttribute("href", "/#record");
    expect(document.querySelector("[data-game-config]")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Play another round" }));
    expect(document.querySelector("[data-game-config]")).not.toBeNull();
    expect(mockStartGame).not.toHaveBeenCalled();
  });

  it("leaves a round the player started by hand alone when the daily board answers late", async () => {
    let answer: (daily: DailyStart) => void = () => {};
    jest.mocked(openDaily).mockReturnValue(new Promise((resolve) => (answer = resolve)));
    window.history.pushState({}, "", "/game?pieceCount=6&memorizeTime=10&source=daily");
    render(<GamePage />);

    fireEvent.click(await screen.findByRole("button", { name: "Start Training" }));
    await act(async () => answer({ kind: "play", pieceCount: 6, memorizeTime: 10, board: BOARD }));

    expect(mockStartGame.mock.calls.map(([, , source]) => source)).toEqual(["game_form"]);
  });

  it("plays an ordinary round from the link in a language without the daily board's copy", () => {
    window.history.pushState({}, "", "/de/game?pieceCount=6&memorizeTime=10&source=daily");

    render(<GamePage />, { locale: "de" });

    expect(mockStartGame).toHaveBeenCalledWith(6, 10, "link");
    expect(openDaily).not.toHaveBeenCalled();
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
    fakeLayout(() =>
      document.body.classList.contains("game-fixed") ? { width: 400, height: 600 } : { width: 1000, height: 1000 },
    );

    render(<GamePage />);

    const board = document.querySelector<HTMLElement>(".game-container");
    expect([board?.style.width, board?.style.height]).toEqual(["400px", "400px"]);
  });

  it("unpins the page when the round leaves the board", () => {
    mockGamePhase = "memorization";
    const { rerender } = render(<GamePage />);

    mockGamePhase = "result";
    rerender(<GamePage />);

    expect([document.documentElement.className, document.body.className]).toEqual(["", ""]);
  });
});
