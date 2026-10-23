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

const expectSettings = (pieceCount: number, memorizeTime: number) => {
  expect(screen.getByLabelText("Number of pieces")).toHaveTextContent(new RegExp(`^${pieceCount}$`));
  expect(screen.getByLabelText("Memorization time")).toHaveTextContent(new RegExp(`^${memorizeTime}s$`));
};

const settings = () => [
  screen.getByLabelText("Number of pieces").textContent,
  screen.getByLabelText("Memorization time").textContent,
];

const press = (name: string, times = 1, init?: { shiftKey: boolean }) => {
  for (let i = 0; i < times; i += 1) fireEvent.click(screen.getByRole("button", { name }), init);
};

const preview = () => {
  const figure = screen.getByRole("img", { name: /^Board preview/ });
  return {
    label: figure.getAttribute("aria-label"),
    count: figure.style.getPropertyValue("--count"),
    study: figure.style.getPropertyValue("--study"),
  };
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
    expect(screen.getByLabelText("Number of pieces")).toHaveTextContent("12");
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
    expectSettings(2, 10);
  });
});

describe("GameConfig remembered settings", () => {
  it("restores a remembered preset", () => {
    useGameStore.setState({ lastSettings: { pieceCount: 12, memorizeTime: 8 } });

    render(<GameConfig />);

    expectPressed(/Hard/);
    expectSettings(12, 8);
  });

  it("restores remembered custom settings", () => {
    useGameStore.setState({ lastSettings: { pieceCount: 7, memorizeTime: 9 } });

    render(<GameConfig />);

    expect(screen.queryAllByRole("button", { pressed: true })).toHaveLength(0);
    expect(screen.getByText("Custom settings")).toBeInTheDocument();
    expectSettings(7, 9);
  });

  it("restores remembered custom settings of 3 pieces at 18 seconds", () => {
    useGameStore.setState({ lastSettings: { pieceCount: 3, memorizeTime: 18 } });

    render(<GameConfig />);

    expect(screen.queryAllByRole("button", { pressed: true })).toHaveLength(0);
    expect(screen.getByText("Custom settings")).toBeInTheDocument();
    expectSettings(3, 18);
  });

  it("starts at Medium with nothing remembered", () => {
    render(<GameConfig />);

    expectPressed(/Medium/);
    expectSettings(6, 10);
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

  it("starts a 60 second round from the stepper and reports it as a form start", () => {
    const gtag = jest.fn();
    window.gtag = gtag;
    render(<GameConfig />);

    press("More study time", 10);
    fireEvent.click(screen.getByRole("button", { name: "Start round" }));

    expect(useGameStore.getState().round).toMatchObject({ phase: "study", config: { pieceCount: 6, studyMs: 60000, source: "game_form" } });
    expect(gtag.mock.calls).toEqual([["event", "round_start", { piece_count: 6, memorize_time: 60, round_source: "game_form" }]]);
  });
});

describe("GameConfig steppers", () => {
  it("steps pieces by one, or by five with Shift", () => {
    render(<GameConfig />);

    press("More pieces");
    const once = settings();
    press("More pieces", 1, { shiftKey: true });
    const shifted = settings();
    press("Fewer pieces", 1, { shiftKey: true });

    expect([once, shifted, settings()]).toEqual([["7", "10s"], ["12", "10s"], ["7", "10s"]]);
  });

  it("steps study time by one second up to 10, then by five, and back down across 15 to 10 to 9", () => {
    render(<GameConfig />);

    const seen: (string | null)[] = [];
    for (let i = 0; i < 2; i += 1) {
      press("More study time");
      seen.push(settings()[1]);
    }
    for (let i = 0; i < 3; i += 1) {
      press("Less study time");
      seen.push(settings()[1]);
    }

    expect(seen).toEqual(["15s", "20s", "15s", "10s", "9s"]);
  });

  it("marks a stepper button unavailable at its end and ignores presses there", () => {
    useGameStore.setState({ lastSettings: { pieceCount: 3, memorizeTime: 2 } });
    render(<GameConfig />);

    press("Fewer pieces", 3);
    press("Less study time", 3);

    expect(settings()).toEqual(["2", "1s"]);
    expect(
      ["Fewer pieces", "More pieces", "Less study time", "More study time"].map((name) =>
        screen.getByRole("button", { name }).getAttribute("aria-disabled"),
      ),
    ).toEqual(["true", "false", "true", "false"]);
  });

  it("drops the preset to Custom once a stepper moves off it, and back when it returns", () => {
    render(<GameConfig />);

    press("More pieces");
    const custom = [screen.queryAllByRole("button", { pressed: true }).length, screen.getByText("Custom settings") !== null];
    press("Fewer pieces");

    expect(custom).toEqual([0, true]);
    expectPressed(/Medium/);
  });
});

describe("GameConfig board preview", () => {
  it("shows the chosen piece count and fills the ring to the share of 60 seconds", () => {
    render(<GameConfig />);
    const medium = preview();

    fireEvent.click(screen.getByRole("button", { name: /Grandmaster/ }));

    expect([medium, preview()]).toEqual([
      { label: "Board preview. Pieces on the board: 6", count: "6", study: "16.67%" },
      { label: "Board preview. Pieces on the board: 20", count: "20", study: "8.33%" },
    ]);
  });
});

