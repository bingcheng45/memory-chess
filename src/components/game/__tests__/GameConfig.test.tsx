import { fireEvent, render, screen } from "@/test-utils/intl";
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
  expect(screen.getByLabelText("Number of pieces")).toHaveValue(String(pieceCount));
  expect(screen.getByLabelText("Memorization time")).toHaveValue(String(memorizeTime));
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
    expect(screen.getByLabelText("Number of pieces")).toHaveValue("12");
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

describe("GameConfig start", () => {
  afterEach(() => {
    Reflect.deleteProperty(window, "gtag");
  });

  it("offers one start button", () => {
    render(<GameConfig />);

    expect(screen.getAllByRole("button", { name: /start/i }).map((button) => button.textContent)).toEqual(["Start round"]);
  });

  it("starts the preset the form is set to", () => {
    const onStart = jest.fn();
    render(<GameConfig onStart={onStart} />);

    fireEvent.click(screen.getByRole("button", { name: /Hard/ }));
    fireEvent.click(screen.getByRole("button", { name: "Start round" }));

    expect(onStart).toHaveBeenCalledWith(12, 8, "game_form");
  });

  it("starts a 60 second round from the slider and reports it as a form start", () => {
    const gtag = jest.fn();
    window.gtag = gtag;
    render(<GameConfig />);

    fireEvent.change(screen.getByLabelText("Memorization time"), { target: { value: "60" } });
    fireEvent.click(screen.getByRole("button", { name: "Start round" }));

    expect(useGameStore.getState().round).toMatchObject({ phase: "study", config: { pieceCount: 6, studyMs: 60000, source: "game_form" } });
    expect(gtag.mock.calls).toEqual([["event", "round_start", { piece_count: 6, memorize_time: 60, source: "game_form" }]]);
  });
});
