import { fireEvent, renderWithIntl, screen, within } from "@/test-utils/intl";
import { ShowcaseBoard } from "@/components/home/ShowcaseBoard";
import { SHOWCASE_STEPS } from "@/lib/home/showcaseTour";

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

describe("ShowcaseBoard", () => {
  it("opens on the full position, the matchup and the first caption", () => {
    renderWithIntl(<ShowcaseBoard />);

    expect(screen.getByRole("figure", { name: /Deep Fritz against Vladimir Kramnik/ })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: / on [a-h][1-8]$/ })).toHaveLength(14);
    expect(screen.getByText("Man vs machine · Game 2")).toBeInTheDocument();
    expect(screen.getByText("Bonn · 27 November 2006")).toBeInTheDocument();
    expect(screen.getByText("Vladimir Kramnik")).toBeInTheDocument();
    expect(screen.getByText(/Black is to move/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
  });

  it("has copy for every step, group and inspected piece", () => {
    const { container } = renderWithIntl(<ShowcaseBoard />);
    const spoken = () => container.textContent ?? "";

    SHOWCASE_STEPS.forEach(() => {
      expect(spoken()).not.toMatch(/home\.lab|\bsteps\.|\btags\./);
      next();
    });
    screen.getAllByRole("button", { name: / on [a-h][1-8]$/ }).forEach((button) => {
      fireEvent.click(button);
      expect(spoken()).not.toMatch(/home\.lab|\binspect\./);
    });
  });

  it("circles the groups one at a time and keeps the earlier ones", () => {
    const { container } = renderWithIntl(<ShowcaseBoard />);
    const circled = () => container.querySelectorAll(".lab-sc-group[data-on]").length;

    expect(circled()).toBe(0);
    next();
    expect(screen.getByText("White's king on h1 with pawns g2 and h2.")).toBeInTheDocument();
    expect(circled()).toBe(1);
    next();
    expect(circled()).toBe(2);
    expect(container.querySelectorAll(".lab-sc-group[data-active]")).toHaveLength(1);
    expect(screen.getByText("Study 2/6")).toBeInTheDocument();
    expect(screen.getByText("Queen on e4, pawn on e5 in front of it.")).toBeInTheDocument();
  });

  it("draws the knight's threat as arrows and dims the other pieces", () => {
    const { container } = renderWithIntl(<ShowcaseBoard />);
    goTo("threat.knight");

    expect(screen.getByText("White threat")).toBeInTheDocument();
    expect(container.querySelectorAll(".lab-sc-arrow")).toHaveLength(4);
    expect(container.querySelectorAll(".lab-sc-arrow[data-faint]")).toHaveLength(3);
    expect(container.querySelectorAll(".lab-piece[data-state='ghost']")).toHaveLength(12);
  });

  it("slides the queen to h7 for the mate and crosses out g8", () => {
    const { container } = renderWithIntl(<ShowcaseBoard />);
    const before = square("white queen on e4");
    goTo("finish.checkmate");

    expect(screen.getByText(/^Qh7#\./)).toBeInTheDocument();
    expect(square("white queen on h7")).toEqual({ file: 7, row: 1 });
    expect(before).toEqual({ file: 4, row: 4 });
    expect(container.querySelectorAll(".lab-sc-cross")).toHaveLength(1);
  });

  it("blanks the board, then brings every piece back", () => {
    renderWithIntl(<ShowcaseBoard />);
    goTo("rebuild.blank");

    expect(screen.getByText(/The board goes blank/)).toBeInTheDocument();
    screen.getAllByRole("button", { name: / on [a-h][1-8]$/ }).forEach((button) => expect(button).toBeDisabled());
    goTo("rebuild.back");
    screen.getAllByRole("button", { name: / on [a-h][1-8]$/ }).forEach((button) => expect(button).toBeEnabled());
  });

  it("shows a clicked piece's reach, and resumes on a second click or Escape", () => {
    const { container } = renderWithIntl(<ShowcaseBoard />);
    goTo("threat.queen");

    fireEvent.click(piece("white queen on e4"));
    expect(screen.getByText(/^White queen on e4\. 19 moves, 1 capture\. Checks: Qh7#\.$/)).toBeInTheDocument();
    expect(screen.getByText("Click again to resume")).toBeInTheDocument();
    expect(piece("white queen on e4")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
    expect(container.querySelectorAll(".lab-sc-dot")).toHaveLength(19);

    fireEvent.click(piece("white queen on e4"));
    expect(screen.queryByText("Click again to resume")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();

    fireEvent.click(piece("black king on h8"));
    expect(screen.getByText(/^Black king on h8\. 1 move, no captures\.$/)).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByText("Click again to resume")).not.toBeInTheDocument();
  });

  it("returns an inspected piece to the study position, even from the finish", () => {
    renderWithIntl(<ShowcaseBoard />);
    goTo("finish.checkmate");

    fireEvent.click(piece("white knight on f8"));
    expect(square("white queen on e4")).toEqual({ file: 4, row: 4 });
  });

  it("leaves inspection when a step is picked", () => {
    renderWithIntl(<ShowcaseBoard />);
    fireEvent.click(piece("white king on h1"));
    next();

    expect(screen.queryByText("Click again to resume")).not.toBeInTheDocument();
    expect(screen.getByText(/White's king on h1 with pawns/)).toBeInTheDocument();
  });

  it("names a pause and a play", () => {
    renderWithIntl(<ShowcaseBoard />);
    const controls = within(screen.getByRole("group", { name: "Steps" }));

    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
    expect(controls.getAllByRole("button")).toHaveLength(SHOWCASE_STEPS.length);
    expect(controls.getByRole("button", { name: /^Step 1 of 14: Study$/ })).toHaveAttribute("aria-current", "step");
  });
});
