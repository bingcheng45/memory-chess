import { fireEvent, render, screen } from "@/test-utils/intl";
import GameConfig from "@/components/game/GameConfig";
import { useGameStore } from "@/lib/store/gameStore";
import type { GameHistory } from "@/lib/types/game";

const pristine = useGameStore.getState();

const mediumRow = (i: number): GameHistory => {
  const accuracy = [90, 75, 100][i % 3];
  return {
    id: `r${i}`,
    timestamp: 0,
    pieceCount: 6,
    memorizeTime: 10,
    accuracy,
    correctPlacements: 6,
    totalPlacements: 6,
    level: 1,
    duration: 25,
    facts: { pieceCount: 6, studySeconds: 10, rebuildSeconds: 15, accuracy },
  };
};

const seed = (skillRating: number, rows: number) =>
  useGameStore.setState({
    gameState: { ...pristine.gameState, skillRating },
    history: Array.from({ length: rows }, (_, i) => mediumRow(i)),
  });

const shown = () =>
  ["phase", "board", "rating", "gain", "loss"].map((part) =>
    part === "phase"
      ? document.querySelector(".lab-preview-phase")?.textContent
      : document.querySelector(`[data-preview="${part}"]`)?.textContent,
  );

const drag = (label: string, value: number) => {
  const slider = screen.getByLabelText(label);
  fireEvent.change(slider, { target: { value: String(value) } });
  return slider;
};

const announced = () => document.querySelector('.lab-config-preview [aria-live="polite"]')?.textContent;

afterEach(() => {
  useGameStore.setState({ gameState: pristine.gameState, history: [], lastSettings: null });
});

describe("rating preview on the setup card", () => {
  it("shows a new player's first placement round on Medium", () => {
    seed(1000, 0);

    render(<GameConfig />);

    expect(shown()).toEqual(["Placement round 1 of 10", "1,000", "1,000", "Up to +40", "At most −40"]);
  });

  it("follows the sliders for a new player", () => {
    seed(1000, 0);
    render(<GameConfig />);

    drag("Number of pieces", 20);
    drag("Memorization time", 5);

    expect(shown()).toEqual(["Placement round 1 of 10", "2,105", "1,000", "Up to +151", "At most −20"]);
  });

  it("counts the placement rounds already played", () => {
    seed(1000, 2);

    render(<GameConfig />);

    expect(shown()).toEqual(["Placement round 3 of 10", "1,000", "1,000", "Up to +43", "At most −37"]);
  });

  it("previews Hard for a 1200 player whose rounds are all Medium", () => {
    seed(1200, 12);
    render(<GameConfig />);

    fireEvent.click(screen.getByRole("button", { name: /Hard/ }));

    expect(shown()).toEqual(["Rated round", "1,598", "1,200", "Up to +50", "At most −1"]);
  });

  it("announces the preview when a slider is released, not while it moves", () => {
    seed(1200, 12);
    render(<GameConfig />);

    const slider = drag("Number of pieces", 20);
    drag("Memorization time", 5);
    expect(announced()).toBe("");

    fireEvent.pointerUp(slider);

    expect(announced()).toBe("Board rating 2,105. Your rating 1,200. If you clear it, up to +50. If you miss, at most −1.");
  });
});
