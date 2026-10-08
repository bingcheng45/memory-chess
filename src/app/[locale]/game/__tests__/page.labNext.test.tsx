import { act, fireEvent, render, screen } from "@/test-utils/intl";
import { playSound, stopTimerSound } from "@/lib/utils/soundEffects";
import GamePage from "@/app/[locale]/game/page";
import { useGameStore } from "@/lib/store/gameStore";

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

jest.mock("@/components/game/ResultLabCard", () => ({
  __esModule: true,
  default: ({ onPlay }: { onPlay: (pieceCount: number, memorizeTime: number, source: string) => void }) => (
    <button type="button" onClick={() => onPlay(7, 4, "result_next")}>
      Lab next
    </button>
  ),
}));

beforeEach(() => {
  jest.spyOn(console, "log").mockImplementation(() => {});
  Object.defineProperty(window, "indexedDB", { value: {}, configurable: true });
});

afterEach(() => {
  useGameStore.getState().resetGame();
  useGameStore.setState({ lastSettings: null });
  localStorage.clear();
  jest.restoreAllMocks();
  Reflect.deleteProperty(window, "indexedDB");
});

describe("GamePage starting the lab card's next round", () => {
  it("starts the card's setting in place, on a fresh round, without leaving the page", async () => {
    render(<GamePage />);
    fireEvent.click(screen.getByRole("button", { name: "Start Training" }));
    act(() => {
      const store = useGameStore.getState();
      store.endMemorizationPhase();
      store.startSolutionPhase();
      store.submitSolution(5);
    });
    const url = window.location.href;

    const next = await screen.findByRole("button", { name: "Lab next" });
    jest.mocked(playSound).mockClear();
    jest.mocked(stopTimerSound).mockClear();
    fireEvent.click(next);

    const { gameState } = useGameStore.getState();
    expect({
      pieceCount: gameState.pieceCount,
      memorizeTime: gameState.memorizeTime,
      startSource: gameState.startSource,
      isMemorizationPhase: gameState.isMemorizationPhase,
      labRoundId: gameState.labRoundId,
      accuracy: gameState.accuracy,
    }).toEqual({ pieceCount: 7, memorizeTime: 4, startSource: "result_next", isMemorizationPhase: true, labRoundId: undefined, accuracy: undefined });
    expect(screen.queryByRole("button", { name: "Lab next" })).toBeNull();
    expect(stopTimerSound).toHaveBeenCalled();
    expect(playSound).toHaveBeenCalledWith("click");
    expect(window.location.href).toBe(url);
  });
});
