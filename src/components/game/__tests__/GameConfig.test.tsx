import { render, screen } from "@/test-utils/intl";
import GameConfig from "@/components/game/GameConfig";

const gameState: { completionTime?: number; accuracy?: number } = {};

jest.mock("@/lib/store/gameStore", () => ({
  useGameStore: () => ({ startGame: jest.fn(), gameState }),
}));

beforeEach(() => {
  delete gameState.completionTime;
  delete gameState.accuracy;
});

afterEach(() => {
  window.history.pushState({}, "", "/");
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
});

describe("GameConfig last-game line", () => {
  it("prints the previous round's time to the millisecond", () => {
    gameState.completionTime = 12.345;
    gameState.accuracy = 90;

    render(<GameConfig />);

    expect(screen.getByText(/12\.345s/)).toBeInTheDocument();
  });

  it("carries into the next second instead of printing a fourth digit", () => {
    gameState.completionTime = 12.9996;
    gameState.accuracy = 90;

    render(<GameConfig />);

    expect(screen.getByText(/13\.000s/)).toBeInTheDocument();
    expect(screen.queryByText(/12\.1000s/)).not.toBeInTheDocument();
  });
});
