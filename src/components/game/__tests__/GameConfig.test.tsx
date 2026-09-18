import { render, screen } from "@/test-utils/intl";
import GameConfig from "@/components/game/GameConfig";

jest.mock("@/lib/store/gameStore", () => ({
  useGameStore: () => ({ startGame: jest.fn(), gameState: {} }),
}));

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
