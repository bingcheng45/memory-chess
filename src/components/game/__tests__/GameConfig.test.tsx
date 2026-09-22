import { render, screen } from "@/test-utils/intl";
import GameConfig from "@/components/game/GameConfig";
import { useGameStore } from "@/lib/store/gameStore";

const pristineGameState = useGameStore.getState().gameState;

const setLastRound = (completionTime: number, accuracy: number) => {
  useGameStore.setState({
    gameState: { ...pristineGameState, completionTime, accuracy },
  });
};

const expectPressed = (label: RegExp) => {
  for (const button of screen.getAllByRole("button", { pressed: true })) {
    expect(button).toHaveAccessibleName(expect.stringMatching(label));
  }
  expect(screen.getByRole("button", { name: label })).toHaveAttribute("aria-pressed", "true");
};

const expectSliders = (pieceCount: number, memorizeTime: number) => {
  expect(screen.getByLabelText("Number of Pieces")).toHaveValue(String(pieceCount));
  expect(screen.getByLabelText("Memorization Time")).toHaveValue(String(memorizeTime));
};

beforeEach(() => {
  useGameStore.setState({ gameState: pristineGameState });
});

afterEach(() => {
  window.history.pushState({}, "", "/");
  useGameStore.setState({ lastSettings: null });
});

describe("GameConfig ?difficulty= deep link", () => {
  it("selects the preset named in the live URL", () => {
    window.history.pushState({}, "", "/game?difficulty=HARD");

    render(<GameConfig />);

    expect(screen.getByRole("button", { name: /Hard/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /Medium/ })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByLabelText("Number of Pieces")).toHaveValue("12");
  });

  it("keeps the Medium default for an unknown difficulty", () => {
    window.history.pushState({}, "", "/game?difficulty=nonsense");

    render(<GameConfig />);

    expect(screen.getByRole("button", { name: /Medium/ })).toHaveAttribute("aria-pressed", "true");
  });

  it("wins over the remembered settings", () => {
    useGameStore.setState({ lastSettings: { pieceCount: 12, memorizeTime: 8 } });
    window.history.pushState({}, "", "/game?difficulty=easy");

    render(<GameConfig />);

    expectPressed(/Easy/);
    expectSliders(2, 10);
  });
});

describe("GameConfig remembered settings", () => {
  it("restores a remembered preset", () => {
    useGameStore.setState({ lastSettings: { pieceCount: 12, memorizeTime: 8 } });

    render(<GameConfig />);

    expectPressed(/Hard/);
    expectSliders(12, 8);
  });

  it("restores remembered custom settings", () => {
    useGameStore.setState({ lastSettings: { pieceCount: 7, memorizeTime: 9 } });

    render(<GameConfig />);

    expect(screen.queryAllByRole("button", { pressed: true })).toHaveLength(0);
    expect(screen.getByText("Custom settings")).toBeInTheDocument();
    expectSliders(7, 9);
  });

  it("restores remembered custom settings of 3 pieces at 18 seconds", () => {
    useGameStore.setState({ lastSettings: { pieceCount: 3, memorizeTime: 18 } });

    render(<GameConfig />);

    expect(screen.queryAllByRole("button", { pressed: true })).toHaveLength(0);
    expect(screen.getByText("Custom settings")).toBeInTheDocument();
    expectSliders(3, 18);
  });

  it("starts at Medium with nothing remembered", () => {
    render(<GameConfig />);

    expectPressed(/Medium/);
    expectSliders(6, 10);
  });
});

describe("GameConfig last-game line", () => {
  it("prints the previous round's time to the millisecond", () => {
    setLastRound(12.345, 90);

    render(<GameConfig />);

    expect(screen.getByText(/12\.345s/)).toBeInTheDocument();
  });

  it("carries into the next second instead of printing a fourth digit", () => {
    setLastRound(12.9996, 90);

    render(<GameConfig />);

    expect(screen.getByText(/13\.000s/)).toBeInTheDocument();
    expect(screen.queryByText(/12\.1000s/)).not.toBeInTheDocument();
  });
});
