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

const summary = () => document.querySelector("[data-preview-summary]")?.textContent;

const details = () => screen.getByRole("button", { name: "Rating details" });

const press = (name: string, times = 1, init?: { shiftKey: boolean }) => {
  for (let i = 0; i < times; i += 1) fireEvent.click(screen.getByRole("button", { name }), init);
};

/** Medium's 6 pieces to 20: two Shift steps of five, then four of one. */
const toTwentyPieces = () => {
  press("More pieces", 2, { shiftKey: true });
  press("More pieces", 4);
};

const settings = () => [
  screen.getByLabelText("Number of pieces").textContent,
  screen.getByLabelText("Memorization time").textContent,
];

const announced = () => document.querySelector('.lab-config-preview [aria-live="polite"]')?.textContent;

afterEach(() => {
  useGameStore.setState({ gameState: pristine.gameState, certainty: NEW, history: [], lastSettings: null });
});

describe("rating preview on the setup card", () => {
  it("sums up the board in one line and keeps the details closed until asked", () => {
    seed(1200, SETTLED);
    render(<GameConfig />);

    fireEvent.click(screen.getByRole("button", { name: /Hard/ }));
    const closed = [summary(), details().getAttribute("aria-expanded"), document.querySelector("[data-preview]")];
    fireEvent.click(details());
    const panel = document.getElementById(details().getAttribute("aria-controls") ?? "");

    expect(closed).toEqual(["Hard, 12 pcs / 8s · Board 1,597 · expect 37%", "false", null]);
    expect(details()).toHaveAttribute("aria-expanded", "true");
    expect(panel?.querySelector('[data-preview="board"]')?.textContent).toBe("1,597");
  });

  it("names custom settings in the summary", () => {
    seed(1200, SETTLED);
    render(<GameConfig />);

    press("More pieces");

    expect(summary()).toMatch(/^Custom settings, 7 pcs \/ 10s · Board /);
  });

  it("shows a new player's provisional rating on Medium, with the expected accuracy and an even board suggested, and no downside", () => {
    seed(1000, NEW);

    render(<GameConfig />);
    fireEvent.click(details());

    expect(shown()).toEqual(["Provisional rating", "1,000", "1,000", "70%", "8 pcs / 10s", "Up to +196", undefined]);
    expect(screen.queryByText("If you miss")).toBeNull();
  });

  it("keeps the downside hidden after a round while the rating is still provisional, and shows it once rated", () => {
    seed(1180, { rd: 300, rounds: 1 });
    const { unmount } = render(<GameConfig />);
    fireEvent.click(details());
    const provisional = shown();
    unmount();

    seed(1180, SETTLED);
    render(<GameConfig />);
    fireEvent.click(details());

    expect([provisional[0], provisional[6], shown()[0], shown()[6]]).toEqual(["Provisional rating", undefined, "Rated round", "At most −18"]);
  });

  it("announces a provisional preview without the downside", () => {
    seed(1000, NEW);
    render(<GameConfig />);

    toTwentyPieces();

    expect(announced()).toBe("Board rating 1,955. Your rating 1,000. Expected accuracy 8%. If you clear it, up to +400.");
  });

  it("follows the steppers for a new player", () => {
    seed(1000, NEW);
    render(<GameConfig />);
    fireEvent.click(details());

    toTwentyPieces();
    press("Less study time", 5);

    expect(shown()).toEqual(["Provisional rating", "2,088", "1,000", "5%", "8 pcs / 10s", "Up to +400", undefined]);
  });

  it("previews Hard for an established 1200 player and suggests a 75% board", () => {
    seed(1200, SETTLED);
    render(<GameConfig />);
    fireEvent.click(details());

    fireEvent.click(screen.getByRole("button", { name: /Hard/ }));

    expect(shown()).toEqual(["Rated round", "1,597", "1,200", "37%", "7 pcs / 10s", "Up to +26", "At most −15"]);
  });

  it("sets the board to the suggested one and marks it as chosen", () => {
    seed(1200, SETTLED);
    render(<GameConfig />);
    fireEvent.click(details());

    fireEvent.click(screen.getByRole("button", { name: "7 pcs / 10s" }));

    expect([settings(), shown()[3], screen.getByRole("button", { name: "7 pcs / 10s" }).hasAttribute("disabled")]).toEqual([["7", "10s"], "75%", true]);
  });

  it("announces the preview on every step, with the details closed", () => {
    seed(1200, SETTLED);
    render(<GameConfig />);
    const before = announced();

    toTwentyPieces();
    press("Less study time", 5);

    expect([before, announced()]).toEqual([
      "",
      "Board rating 2,088. Your rating 1,200. Expected accuracy 10%. If you clear it, up to +50. If you miss, at most −6.",
    ]);
  });
});
