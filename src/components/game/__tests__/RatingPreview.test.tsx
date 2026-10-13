import { fireEvent, render, screen } from "@/test-utils/intl";
import GameConfig from "@/components/game/GameConfig";
import { useGameStore } from "@/lib/store/gameStore";

const pristine = useGameStore.getState();

/** A player the game is sure of, and a new one. */
const SETTLED = { rd: 74, rounds: 100 };
const NEW = { rd: 350, rounds: 0 };

const seed = (skillRating: number, certainty: { rd: number; rounds: number }) =>
  useGameStore.setState({ gameState: { ...pristine.gameState, skillRating }, certainty, history: [] });

const shown = () =>
  ["phase", "board", "rating", "expected", "suggested", "gain", "loss"].map((part) =>
    part === "phase"
      ? document.querySelector(".lab-preview-phase")?.textContent
      : document.querySelector(`[data-preview="${part}"]`)?.textContent,
  );

const drag = (label: string, value: number) => {
  const slider = screen.getByLabelText(label);
  fireEvent.change(slider, { target: { value: String(value) } });
  return slider;
};

const sliders = () => [
  screen.getByLabelText<HTMLInputElement>("Number of pieces").value,
  screen.getByLabelText<HTMLInputElement>("Memorization time").value,
];

const announced = () => document.querySelector('.lab-config-preview [aria-live="polite"]')?.textContent;

afterEach(() => {
  useGameStore.setState({ gameState: pristine.gameState, certainty: NEW, history: [], lastSettings: null });
});

describe("rating preview on the setup card", () => {
  it("shows a new player's provisional rating on Medium, with the expected accuracy and an even board suggested", () => {
    seed(1000, NEW);

    render(<GameConfig />);

    expect(shown()).toEqual(["Provisional rating", "1,000", "1,000", "70%", "8 pcs / 10s", "Up to +192", "At most −400"]);
  });

  it("follows the sliders for a new player", () => {
    seed(1000, NEW);
    render(<GameConfig />);

    drag("Number of pieces", 20);
    drag("Memorization time", 5);

    expect(shown()).toEqual(["Provisional rating", "2,105", "1,000", "5%", "8 pcs / 10s", "Up to +400", "At most −109"]);
  });

  it("previews Hard for an established 1200 player and suggests a 75% board", () => {
    seed(1200, SETTLED);
    render(<GameConfig />);

    fireEvent.click(screen.getByRole("button", { name: /Hard/ }));

    expect(shown()).toEqual(["Rated round", "1,598", "1,200", "37%", "7 pcs / 10s", "Up to +50", "At most −36"]);
  });

  it("sets the sliders to the suggested board and marks it as chosen", () => {
    seed(1200, SETTLED);
    render(<GameConfig />);

    fireEvent.click(screen.getByRole("button", { name: "7 pcs / 10s" }));

    expect([sliders(), shown()[3], screen.getByRole("button", { name: "7 pcs / 10s" }).hasAttribute("disabled")]).toEqual([["7", "10"], "75%", true]);
  });

  it("announces the preview when a slider is released, not while it moves", () => {
    seed(1200, SETTLED);
    render(<GameConfig />);

    const slider = drag("Number of pieces", 20);
    drag("Memorization time", 5);
    expect(announced()).toBe("");

    fireEvent.pointerUp(slider);

    expect(announced()).toBe("Board rating 2,105. Your rating 1,200. Expected accuracy 9%. If you clear it, up to +50. If you miss, at most −14.");
  });
});
