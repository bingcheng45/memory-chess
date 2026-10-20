import { act, fireEvent, render, screen } from "@/test-utils/intl";
import WoodenGameDemo from "@/components/learn/WoodenGameDemo";
import { FRAMES, PEG_COLORS, pegColor } from "@/components/learn/woodenGame";

const caption = () => document.querySelector(".wg-caption")?.textContent ?? "";

function reduceMotion(reduce: boolean) {
  jest.spyOn(window, "matchMedia").mockImplementation(
    (query) => ({ matches: reduce && query.includes("reduce"), media: query, addEventListener: jest.fn(), removeEventListener: jest.fn() }) as unknown as MediaQueryList,
  );
}

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

describe("the wooden game script", () => {
  it("deals four pegs of each of the six colours", () => {
    const counts = Object.fromEntries(PEG_COLORS.map((color) => [color, FRAMES[0].places.filter((_, id) => pegColor(id) === color).length]));

    expect(counts).toEqual({ red: 4, yellow: 4, blue: 4, green: 4, black: 4, white: 4 });
  });

  it("ends with the winner holding four blue pegs", () => {
    const last = FRAMES[FRAMES.length - 1];
    const winnersPegs = last.places.flatMap((place, id) => (place.kind === "tray" && place.player === last.winner ? [pegColor(id)] : []));

    expect(last.winner).toBe(0);
    expect(winnersPegs.filter((color) => color === "blue")).toHaveLength(4);
  });

  it("puts a missed peg back in the hole it came from", () => {
    const miss = FRAMES.findIndex((frame) => frame.caption.startsWith("No match"));
    const lifted = FRAMES[miss - 1].places.findIndex((place) => place.kind === "lifted");

    expect(FRAMES[miss].places[lifted]).toEqual({ kind: "hole" });
    expect(FRAMES[miss].turn).toBe(1);
  });
});

describe("WoodenGameDemo", () => {
  it("plays itself through every step, announcing each caption, then offers a replay", () => {
    reduceMotion(false);
    jest.useFakeTimers();
    render(<WoodenGameDemo />);

    expect(caption()).toBe(`1 / ${FRAMES.length} ${FRAMES[0].caption}`);
    expect(document.querySelector(".wg-caption")).toHaveAttribute("aria-live", "polite");

    act(() => jest.advanceTimersByTime(3200));
    expect(caption()).toBe(`2 / ${FRAMES.length} ${FRAMES[1].caption}`);

    for (let index = 2; index < FRAMES.length; index += 1) act(() => jest.advanceTimersByTime(3200));
    expect(caption()).toBe(`${FRAMES.length} / ${FRAMES.length} Four pegs of one colour. Player 1 wins the game.`);
    expect(screen.getByRole("button", { name: "Replay" })).toBeInTheDocument();
  });

  it("stays still under reduced motion and steps by the buttons and dots", () => {
    reduceMotion(true);
    jest.useFakeTimers();
    render(<WoodenGameDemo />);

    act(() => jest.advanceTimersByTime(10000));
    expect(caption()).toContain(FRAMES[0].caption);
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(caption()).toContain(FRAMES[1].caption);

    fireEvent.click(screen.getByRole("button", { name: `Step 7 of ${FRAMES.length}` }));
    expect(caption()).toBe(`7 / ${FRAMES.length} No match. The peg goes back in the same hole, and the turn passes to Player 2.`);
    expect(screen.getByRole("button", { name: `Step 7 of ${FRAMES.length}` })).toHaveAttribute("aria-current", "step");

    fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    expect(caption()).toContain(FRAMES[5].caption);
  });

  it("pauses on request", () => {
    reduceMotion(false);
    jest.useFakeTimers();
    render(<WoodenGameDemo />);

    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    act(() => jest.advanceTimersByTime(10000));

    expect(caption()).toContain(FRAMES[0].caption);
    expect(screen.getByRole("button", { name: "Play" })).toHaveAttribute("aria-pressed", "false");
  });
});
