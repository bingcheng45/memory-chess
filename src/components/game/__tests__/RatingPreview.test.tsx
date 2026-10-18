import { fireEvent, render, screen } from "@/test-utils/intl";
import GameConfig from "@/components/game/GameConfig";
import { useGameStore } from "@/lib/store/gameStore";

const pristine = useGameStore.getState();

/** A player the game is sure of, and a new one. */
const SETTLED = { rd: 47, rounds: 100 };
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
  it("shows a new player's provisional rating on Medium, with the expected accuracy and an even board suggested, and no downside", () => {
    seed(1000, NEW);

    render(<GameConfig />);

    expect(shown()).toEqual(["Provisional rating", "1,000", "1,000", "70%", "8 pcs / 10s", "Up to +196", undefined]);
    expect(screen.queryByText("If you miss")).toBeNull();
  });

  it("keeps the downside hidden after a round while the rating is still provisional, and shows it once rated", () => {
    seed(1180, { rd: 300, rounds: 1 });
    const { unmount } = render(<GameConfig />);
    const provisional = shown();
    unmount();

    seed(1180, SETTLED);
    render(<GameConfig />);

    expect([provisional[0], provisional[6], shown()[0], shown()[6]]).toEqual(["Provisional rating", undefined, "Rated round", "At most −18"]);
  });

  it("announces a provisional preview without the downside", () => {
    seed(1000, NEW);
    render(<GameConfig />);

    fireEvent.pointerUp(drag("Number of pieces", 20));

    expect(announced()).toBe("Board rating 1,955. Your rating 1,000. Expected accuracy 8%. If you clear it, up to +400.");
  });

  it("follows the sliders for a new player", () => {
    seed(1000, NEW);
    render(<GameConfig />);

    drag("Number of pieces", 20);
    drag("Memorization time", 5);

    expect(shown()).toEqual(["Provisional rating", "2,088", "1,000", "5%", "8 pcs / 10s", "Up to +400", undefined]);
  });

  it("previews Hard for an established 1200 player and suggests a 75% board", () => {
    seed(1200, SETTLED);
    render(<GameConfig />);

    fireEvent.click(screen.getByRole("button", { name: /Hard/ }));

    expect(shown()).toEqual(["Rated round", "1,597", "1,200", "37%", "7 pcs / 10s", "Up to +26", "At most −15"]);
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

    expect(announced()).toBe("Board rating 2,088. Your rating 1,200. Expected accuracy 10%. If you clear it, up to +50. If you miss, at most −6.");
  });
});
