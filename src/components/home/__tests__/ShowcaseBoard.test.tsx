import { act, fireEvent, renderWithIntl, screen, within } from "@/test-utils/intl";
import { ShowcaseBoard } from "@/components/home/ShowcaseBoard";
import { SHOWCASE_STEPS, STEP_MS } from "@/lib/home/showcaseTour";

const piece = (name: string) => screen.getByRole("button", { name });
const next = () => fireEvent.click(screen.getByRole("button", { name: "Next step" }));
const goTo = (key: string) => {
  const target = SHOWCASE_STEPS.findIndex((step) => step.key === key);
  fireEvent.click(screen.getByRole("button", { name: new RegExp(`^Step ${target + 1} of ${SHOWCASE_STEPS.length}:`) }));
};
const square = (name: string) => {
  const style = piece(name).getAttribute("style") ?? "";
  return { file: Number(/--file: (\d)/.exec(style)?.[1]), row: Number(/--row: (\d)/.exec(style)?.[1]) };
};
const playPlies = (count: number) => {
  for (let ply = 0; ply < count; ply++) act(() => jest.advanceTimersByTime(STEP_MS.ply));
};

describe("ShowcaseBoard", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("opens on the full position, the matchup and the first caption", () => {
    renderWithIntl(<ShowcaseBoard />);

    expect(screen.getByRole("figure", { name: /Veselin Topalov against Alexey Shirov/ })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: / on [a-h][1-8]$/ })).toHaveLength(10);
    expect(screen.getByText("Linares · Round 10")).toBeInTheDocument();
    expect(screen.getByText("4 March 1998")).toBeInTheDocument();
    expect(screen.getByText("Alexey Shirov")).toBeInTheDocument();
    expect(screen.getByText(/two pawns up, but bishops on opposite colours often hold a draw\. Ten pieces\./)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
  });

  it("has copy for every step, group and inspected piece", () => {
    const { container } = renderWithIntl(<ShowcaseBoard />);
    const spoken = () => container.textContent ?? "";

    SHOWCASE_STEPS.forEach(() => {
      expect(spoken()).not.toMatch(/home\.lab|\bsteps\.|\btags\.|\bcounter\./);
      next();
    });
    screen.getAllByRole("button", { name: / on [a-h][1-8]$/ }).forEach((button) => {
      fireEvent.click(button);
      expect(spoken()).not.toMatch(/home\.lab|\binspect\./);
    });
  });

  it("circles the groups one at a time, keeps the earlier ones, and draws what ties each together", () => {
    const { container } = renderWithIntl(<ShowcaseBoard />);
    const circled = () => container.querySelectorAll(".lab-sc-group[data-on] .lab-sc-box").length;

    expect(circled()).toBe(0);
    next();
    expect(screen.getByText("White's king on g1 guards the g2 pawn. The h-pawn has run to h4.")).toBeInTheDocument();
    expect(circled()).toBe(1);
    expect(container.querySelectorAll(".lab-sc-arrow[data-kind='defends']")).toHaveLength(1);
    next();
    expect(circled()).toBe(2);
    expect(container.querySelectorAll(".lab-sc-group[data-active] .lab-sc-box")).toHaveLength(1);
    expect(screen.getByText("Study 2/4")).toBeInTheDocument();
    expect(container.querySelectorAll(".lab-sc-arrow[data-kind='attacks']")).toHaveLength(1);
    expect(container.querySelectorAll(".lab-sc-arrow[data-kind='controls']")).toHaveLength(1);
  });

  it("boxes in the black king: crosses on d5, e5 and f5, the bishop's two lines, the rest dimmed", () => {
    const { container } = renderWithIntl(<ShowcaseBoard />);
    goTo("trap.king");

    expect(screen.getAllByText("The trap")).toHaveLength(2);
    expect(screen.getByText(/Only Kd6, Kd7, Ke7 and Kf7/)).toBeInTheDocument();
    expect(container.querySelectorAll(".lab-sc-cross")).toHaveLength(3);
    expect(container.querySelectorAll(".lab-sc-arrow")).toHaveLength(2);
    expect(container.querySelectorAll(".lab-piece[data-state='ghost']")).toHaveLength(5);
  });

  it("plays the walk ply by ply, takes the bishop off, and draws the king's path at the end", () => {
    const { container } = renderWithIntl(<ShowcaseBoard />);
    goTo("game.walk");

    expect(screen.getByText(/^48\.gxh3 Kf5 49\.Kf2 Ke4\./)).toBeInTheDocument();
    expect(square("white pawn on h3")).toEqual({ file: 7, row: 5 });
    expect(piece("black bishop on h3")).toBeDisabled();
    expect(square("black king on e6")).toEqual({ file: 4, row: 2 });
    expect(container.querySelectorAll(".lab-sc-arrow[data-kind='move']")).toHaveLength(0);

    playPlies(3);
    expect(square("black king on e4")).toEqual({ file: 4, row: 4 });
    expect(square("white king on f2")).toEqual({ file: 5, row: 6 });
    expect(container.querySelectorAll(".lab-sc-arrow[data-kind='move']")).toHaveLength(2);
    expect(screen.getByText("Game 2/3")).toBeInTheDocument();
  });

  it("shows the end of a stretch at once, paused, under reduced motion", () => {
    const original = window.matchMedia;
    window.matchMedia = jest.fn().mockImplementation(() => ({
      matches: true,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));
    try {
      renderWithIntl(<ShowcaseBoard />);
      expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
      goTo("game.walk");
      expect(square("black king on e4")).toEqual({ file: 4, row: 4 });
    } finally {
      window.matchMedia = original;
    }
  });

  it("ends with two runners and the bishop on e7, the f6 pawn gone", () => {
    renderWithIntl(<ShowcaseBoard />);
    goTo("game.runners");
    playPlies(7);

    expect(square("black king on b3")).toEqual({ file: 1, row: 5 });
    expect(square("white bishop on e7")).toEqual({ file: 4, row: 1 });
    expect(piece("black pawn on f6")).toBeDisabled();
    expect(screen.getByText("Topalov took the bishop and resigned after 53...Kb3.")).toBeInTheDocument();
  });

  it("blanks the board, brings every piece back, then ticks the checks", () => {
    const { container } = renderWithIntl(<ShowcaseBoard />);
    goTo("rebuild.blank");

    expect(screen.getByText(/The board goes blank/)).toBeInTheDocument();
    screen.getAllByRole("button", { name: / on [a-h][1-8]$/ }).forEach((button) => expect(button).toBeDisabled());
    goTo("rebuild.back");
    screen.getAllByRole("button", { name: / on [a-h][1-8]$/ }).forEach((button) => expect(button).toBeEnabled());
    expect(square("black bishop on f5")).toEqual({ file: 5, row: 3 });
    goTo("rebuild.check");
    expect(container.querySelectorAll(".lab-sc-tick")).toHaveLength(3);
    expect(screen.getByText(/c3 dark and f5 light/)).toBeInTheDocument();
  });

  it("shows a clicked piece's reach, and resumes on a second click or Escape", () => {
    const { container } = renderWithIntl(<ShowcaseBoard />);
    goTo("trap.king");

    fireEvent.click(piece("black king on e6"));
    expect(screen.getByText(/^Black king on e6\. 4 moves, no captures\.$/)).toBeInTheDocument();
    expect(screen.getByText("Click again to resume")).toBeInTheDocument();
    expect(piece("black king on e6")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
    expect(container.querySelectorAll(".lab-sc-dot")).toHaveLength(4);

    fireEvent.click(piece("black king on e6"));
    expect(screen.queryByText("Click again to resume")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();

    fireEvent.click(piece("white bishop on c3"));
    expect(screen.getByText(/^White bishop on c3\. 8 moves, 1 capture\.$/)).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByText("Click again to resume")).not.toBeInTheDocument();
  });

  it("returns an inspected piece to the study position, even from the end of the game", () => {
    renderWithIntl(<ShowcaseBoard />);
    goTo("game.runners");
    playPlies(7);

    fireEvent.click(piece("black king on b3"));
    expect(square("black king on e6")).toEqual({ file: 4, row: 2 });
    expect(piece("black bishop on f5")).toBeEnabled();
  });

  it("leaves inspection when a step is picked", () => {
    renderWithIntl(<ShowcaseBoard />);
    fireEvent.click(piece("white king on g1"));
    next();

    expect(screen.queryByText("Click again to resume")).not.toBeInTheDocument();
    expect(screen.getByText(/White's king on g1 guards/)).toBeInTheDocument();
  });

  it("names a pause and a play", () => {
    renderWithIntl(<ShowcaseBoard />);
    const controls = within(screen.getByRole("group", { name: "Steps" }));

    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
    expect(controls.getAllByRole("button")).toHaveLength(SHOWCASE_STEPS.length);
    expect(controls.getByRole("button", { name: /^Step 1 of 12: Study$/ })).toHaveAttribute("aria-current", "step");
  });
});
