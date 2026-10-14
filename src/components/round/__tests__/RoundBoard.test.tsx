import { useReducer } from "react";
import { act, fireEvent, renderWithIntl, screen } from "@/test-utils/intl";
import { BOARD_SQUARES, type SquareName } from "@/lib/game/board";
import { labPositionFromFen, roundReducer, type RoundAction, type RoundState } from "@/lib/round/round";
import { RefusalAnnouncement, RoundBoard, RoundPalette } from "@/components/round/RoundBoard";

if (!("PointerEvent" in window)) {
  class PointerEventPolyfill extends MouseEvent {
    readonly pointerId: number;
    readonly pointerType: string;
    readonly isPrimary: boolean;
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 1;
      this.pointerType = init.pointerType ?? "mouse";
      this.isPrimary = init.isPrimary ?? true;
    }
  }
  Object.assign(window, { PointerEvent: PointerEventPolyfill });
}

function rebuilding(...actions: RoundAction[]): RoundState {
  const config = { pieceCount: 4, studyMs: 5000, source: "game_form" } as const;
  const start: RoundAction = { type: "start", config, target: labPositionFromFen("8/8/8/8/8/8/8/4K3"), now: 0 };
  return [start, { type: "studyEnded", now: 1000 } as RoundAction, ...actions].reduce(roundReducer, { phase: "idle" });
}

function Round({ initial }: { initial: RoundState }) {
  const [state, dispatch] = useReducer(roundReducer, initial);
  return (
    <>
      <RoundBoard state={state} dispatch={dispatch} copy="game.round" />
      <RoundPalette state={state} dispatch={dispatch} copy="game.round" />
      <button type="button" onClick={() => dispatch({ type: "submit", now: 9000 })}>
        Submit
      </button>
      <p aria-live="polite" data-testid="live">
        Board cleared.
        <RefusalAnnouncement state={state} copy="game.round" />
      </p>
    </>
  );
}

/** Squares sit 10px apart along x at y = 0; any other point is off the board. */
const pointOf = (square: SquareName) => ({ clientX: BOARD_SQUARES.indexOf(square) * 10 + 5, clientY: 5 });
const OFF_BOARD = { clientX: 5, clientY: 900 };

// A drag's release holds back the next click until the next press; press once so it never reaches the next test.
afterEach(() => fireEvent.pointerDown(document.body));

beforeEach(() => {
  Object.assign(document, {
    elementFromPoint: (x: number, y: number) =>
      y < 10 ? document.querySelector(`[data-coordinate="${BOARD_SQUARES[Math.floor(x / 10)]}"]`) : document.body,
  });
});

const cell = (square: SquareName) => document.querySelector(`[data-coordinate="${square}"]`) as HTMLElement;
const palette = (name: string) => screen.getByRole("button", { name: new RegExp(`^${name}, \\d+ left$`) });

function drag(from: HTMLElement, path: { clientX: number; clientY: number }[]) {
  const [start, ...rest] = path;
  const init = { pointerId: 7, isPrimary: true, button: 0, pointerType: "mouse" };
  fireEvent.pointerDown(from, { ...init, ...start });
  for (const point of rest) fireEvent.pointerMove(from, { ...init, ...point });
  fireEvent.pointerUp(from, { ...init, ...rest.at(-1) });
}

describe("the palette inventory", () => {
  it("names each piece with what is left of it", () => {
    renderWithIntl(<Round initial={rebuilding({ type: "select", piece: { color: "white", type: "knight" } }, { type: "tapSquare", square: "b1", now: 2000 })} />);

    expect(palette("white knight")).toHaveAccessibleName("white knight, 1 left");
    expect(palette("white pawn")).toHaveAccessibleName("white pawn, 8 left");
    expect(palette("white knight")).not.toHaveAttribute("data-used-up");
  });

  it("greys out a used-up piece, keeps it in the tab order and says why when a third knight is tried", () => {
    renderWithIntl(<Round initial={rebuilding()} />);

    fireEvent.click(palette("white knight"));
    fireEvent.click(cell("b1"));
    fireEvent.click(cell("g1"));
    fireEvent.click(cell("e4"));

    const knight = screen.getByRole("button", { name: "white knight, 0 left" });
    // Pressing it still selects it, so it is not announced as disabled; its name says none are left.
    expect(knight).toHaveAttribute("data-used-up");
    expect(knight).not.toHaveAttribute("aria-disabled");
    expect(knight).toHaveAttribute("aria-pressed", "true");
    expect(knight).not.toBeDisabled();
    expect(cell("e4")).toHaveAccessibleName("e4, empty");
    expect(screen.getByTestId("live")).toHaveTextContent("Board cleared. Both white knights are on the board.");
    expect(screen.getByText("Both white knights are on the board.", { selector: "p" })).toBeInTheDocument();
  });

  it("explains a used-up king when its greyed button is pressed", () => {
    renderWithIntl(<Round initial={rebuilding({ type: "place", piece: { color: "white", type: "king" }, square: "e1", now: 2000 })} />);

    fireEvent.click(screen.getByRole("button", { name: "white king, 0 left" }));

    expect(screen.getByTestId("live")).toHaveTextContent("The white king is already on the board.");
  });

  it("takes the message off the screen after a few seconds", () => {
    jest.useFakeTimers();
    renderWithIntl(<Round initial={rebuilding({ type: "place", piece: { color: "black", type: "queen" }, square: "d8", now: 2000 })} />);

    fireEvent.click(screen.getByRole("button", { name: "black queen, 0 left" }));
    expect(screen.getByText("The black queen is already on the board.", { selector: "p" })).toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(4000);
    });

    expect(screen.queryByText("The black queen is already on the board.", { selector: "p" })).not.toBeInTheDocument();
    jest.useRealTimers();
  });
});

describe("drag and drop", () => {
  it("places a palette piece dragged onto a square", () => {
    renderWithIntl(<Round initial={rebuilding()} />);

    drag(palette("white knight"), [{ clientX: 300, clientY: 600 }, { clientX: 320, clientY: 560 }, pointOf("f3")]);

    expect(cell("f3")).toHaveAccessibleName("f3, white knight");
    expect(palette("white knight")).toHaveAccessibleName("white knight, 1 left");
  });

  it("places a palette piece released on a square before any move was heard", () => {
    renderWithIntl(<Round initial={rebuilding()} />);
    const init = { pointerId: 7, isPrimary: true, button: 0, pointerType: "mouse" };

    fireEvent.pointerDown(palette("white knight"), { ...init, clientX: 300, clientY: 600 });
    fireEvent.pointerUp(palette("white knight"), { ...init, ...pointOf("f3") });
    fireEvent.click(palette("white knight"));

    expect(cell("f3")).toHaveAccessibleName("f3, white knight");
    expect(palette("white knight")).toHaveAccessibleName("white knight, 1 left");
    expect(palette("white knight")).toHaveAttribute("aria-pressed", "false");
  });

  it("moves a board piece released on another square before any move was heard", () => {
    renderWithIntl(<Round initial={rebuilding({ type: "place", piece: { color: "white", type: "king" }, square: "a8", now: 2000 })} />);
    const init = { pointerId: 7, isPrimary: true, button: 0, pointerType: "mouse" };

    fireEvent.pointerDown(cell("a8"), { ...init, ...pointOf("a8") });
    fireEvent.pointerUp(cell("a8"), { ...init, ...pointOf("d8") });
    fireEvent.click(cell("a8"));

    expect(cell("d8")).toHaveAccessibleName("d8, white king");
    expect(cell("a8")).toHaveAccessibleName("a8, empty");
    expect(palette("white king")).toHaveAttribute("aria-pressed", "false");
  });

  it("refuses to drag a used-up piece and says why", () => {
    const initial = rebuilding(
      { type: "place", piece: { color: "white", type: "king" }, square: "e1", now: 2000 },
    );
    renderWithIntl(<Round initial={initial} />);

    const king = screen.getByRole("button", { name: "white king, 0 left" });
    const init = { pointerId: 8, isPrimary: true, button: 0, pointerType: "mouse" };

    fireEvent.pointerDown(king, { ...init, clientX: 300, clientY: 600 });
    fireEvent.pointerMove(king, { ...init, ...pointOf("e4") });
    expect(document.querySelector(".lab-drag-ghost")).toBeNull();
    expect(cell("e4")).not.toHaveAttribute("data-drop-target");
    fireEvent.pointerUp(king, { ...init, ...pointOf("e4") });

    expect(cell("e4")).toHaveAccessibleName("e4, empty");
    expect(screen.getByTestId("live")).toHaveTextContent("The white king is already on the board.");
  });

  it("moves a placed piece dragged to another square", () => {
    renderWithIntl(<Round initial={rebuilding({ type: "place", piece: { color: "black", type: "rook" }, square: "a8", now: 2000 })} />);

    drag(cell("a8"), [pointOf("a8"), pointOf("c8"), pointOf("h8")]);

    expect(cell("a8")).toHaveAccessibleName("a8, empty");
    expect(cell("h8")).toHaveAccessibleName("h8, black rook");
  });

  it("replaces the piece it is dropped on, as a tap with a selected piece does", () => {
    const initial = rebuilding(
      { type: "place", piece: { color: "black", type: "rook" }, square: "a8", now: 2000 },
      { type: "place", piece: { color: "white", type: "pawn" }, square: "c8", now: 2100 },
    );
    renderWithIntl(<Round initial={initial} />);

    drag(cell("a8"), [pointOf("a8"), pointOf("c8")]);

    expect(cell("c8")).toHaveAccessibleName("c8, black rook");
    expect(palette("white pawn")).toHaveAccessibleName("white pawn, 8 left");
  });

  it("removes a placed piece dragged off the board", () => {
    renderWithIntl(<Round initial={rebuilding({ type: "place", piece: { color: "black", type: "rook" }, square: "a8", now: 2000 })} />);

    drag(cell("a8"), [pointOf("a8"), OFF_BOARD]);

    expect(cell("a8")).toHaveAccessibleName("a8, empty");
    expect(palette("black rook")).toHaveAccessibleName("black rook, 2 left");
  });

  it("puts everything back when Escape cancels the drag, and the release is not a tap", () => {
    renderWithIntl(<Round initial={rebuilding({ type: "place", piece: { color: "black", type: "rook" }, square: "a8", now: 2000 })} />);
    const init = { pointerId: 3, isPrimary: true, button: 0 };

    fireEvent.pointerDown(cell("a8"), { ...init, ...pointOf("a8") });
    fireEvent.pointerMove(cell("a8"), { ...init, ...pointOf("d8") });
    expect(cell("d8")).toHaveAttribute("data-drop-target");
    expect(document.querySelector(".lab-drag-ghost")).not.toBeNull();
    fireEvent.keyDown(window, { key: "Escape" });
    fireEvent.pointerUp(cell("a8"), { ...init, ...pointOf("d8") });
    fireEvent.click(cell("a8"));

    expect(cell("a8")).toHaveAccessibleName("a8, black rook");
    expect(cell("d8")).not.toHaveAttribute("data-drop-target");
    expect(document.querySelector(".lab-drag-ghost")).toBeNull();
  });

  it("restores the board when the browser cancels the pointer", () => {
    renderWithIntl(<Round initial={rebuilding({ type: "place", piece: { color: "black", type: "rook" }, square: "a8", now: 2000 })} />);
    const init = { pointerId: 4, isPrimary: true, button: 0 };

    fireEvent.pointerDown(cell("a8"), { ...init, ...pointOf("a8") });
    fireEvent.pointerMove(cell("a8"), { ...init, ...pointOf("d8") });
    fireEvent.pointerCancel(cell("a8"), init);

    expect(cell("a8")).toHaveAccessibleName("a8, black rook");
    expect(cell("d8")).toHaveAccessibleName("d8, empty");
    expect(document.querySelector(".lab-drag-ghost")).toBeNull();
  });

  it("with a finger, drops the piece where its ghost rides, above the finger", () => {
    renderWithIntl(<Round initial={rebuilding()} />);
    const init = { pointerId: 9, isPrimary: true, button: 0, pointerType: "touch" };
    const fingerBelow = (square: SquareName) => ({ clientX: pointOf(square).clientX, clientY: pointOf(square).clientY + 36 });

    fireEvent.pointerDown(palette("white queen"), { ...init, clientX: 300, clientY: 600 });
    fireEvent.pointerMove(palette("white queen"), { ...init, ...fingerBelow("d1") });
    fireEvent.pointerUp(palette("white queen"), { ...init, ...fingerBelow("d1") });

    expect(cell("d1")).toHaveAccessibleName("d1, white queen");
  });

  it("cancels when the pointer capture is lost mid-drag, and the next press drags again", () => {
    renderWithIntl(<Round initial={rebuilding({ type: "place", piece: { color: "black", type: "rook" }, square: "a8", now: 2000 })} />);
    const init = { pointerId: 5, isPrimary: true, button: 0 };

    fireEvent.pointerDown(cell("a8"), { ...init, ...pointOf("a8") });
    fireEvent.pointerMove(cell("a8"), { ...init, ...pointOf("d8") });
    fireEvent.lostPointerCapture(cell("a8"), init);
    expect(document.querySelector(".lab-drag-ghost")).toBeNull();
    drag(cell("a8"), [pointOf("a8"), pointOf("e8")]);

    expect(cell("e8")).toHaveAccessibleName("e8, black rook");
  });

  it("treats a press on a placed piece that barely moves as a tap, which lifts it", () => {
    renderWithIntl(<Round initial={rebuilding({ type: "place", piece: { color: "white", type: "bishop" }, square: "c1", now: 2000 })} />);

    drag(cell("c1"), [pointOf("c1"), { clientX: pointOf("c1").clientX + 3, clientY: 7 }]);
    fireEvent.click(cell("c1"));

    expect(cell("c1")).toHaveAccessibleName("c1, empty");
    expect(document.querySelector(".lab-drag-ghost")).toBeNull();
  });

  it("swallows the click a drag's release sends to the square it started on", () => {
    renderWithIntl(<Round initial={rebuilding({ type: "place", piece: { color: "black", type: "rook" }, square: "a8", now: 2000 })} />);

    fireEvent.click(palette("white pawn"));
    drag(cell("a8"), [pointOf("a8"), pointOf("b8")]);
    fireEvent.click(cell("a8"));

    expect(cell("b8")).toHaveAccessibleName("b8, black rook");
    expect(cell("a8")).toHaveAccessibleName("a8, empty");
  });
});

describe("a drag whose piece stops being draggable before the release", () => {
  const mouse = { pointerId: 12, isPrimary: true, button: 0, pointerType: "mouse" };
  const traces = () => ({
    ghost: document.querySelector(".lab-drag-ghost") !== null,
    dropTarget: document.querySelector("[data-drop-target]")?.getAttribute("data-coordinate") ?? null,
    lifted: document.querySelector("[data-lifted]")?.getAttribute("data-coordinate") ?? null,
  });
  const settled = { ghost: false, dropTarget: null, lifted: null };

  it("ends when the round is submitted from the keyboard mid-drag", () => {
    renderWithIntl(<Round initial={rebuilding({ type: "place", piece: { color: "black", type: "rook" }, square: "a8", now: 2000 })} />);

    fireEvent.pointerDown(cell("a8"), { ...mouse, ...pointOf("a8") });
    fireEvent.pointerMove(cell("a8"), { ...mouse, ...pointOf("d8") });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(traces()).toEqual(settled);
    fireEvent.pointerMove(cell("a8"), { ...mouse, ...pointOf("e8") });
    fireEvent.pointerUp(cell("a8"), { ...mouse, ...pointOf("e8") });

    expect(traces()).toEqual(settled);
    expect(cell("a8")).toHaveAccessibleName("a8, black rook");
  });

  it("ends on the release when a key lifts the piece mid-drag", () => {
    renderWithIntl(<Round initial={rebuilding({ type: "place", piece: { color: "black", type: "rook" }, square: "a8", now: 2000 })} />);

    fireEvent.pointerDown(cell("a8"), { ...mouse, ...pointOf("a8") });
    fireEvent.pointerMove(cell("a8"), { ...mouse, ...pointOf("d8") });
    fireEvent.click(cell("a8"));
    fireEvent.pointerUp(cell("a8"), { ...mouse, ...pointOf("d8") });

    expect(traces()).toEqual(settled);
    expect(cell("d8")).toHaveAccessibleName("d8, empty");
    drag(palette("white pawn"), [{ clientX: 300, clientY: 600 }, pointOf("c8")]);
    expect(cell("c8")).toHaveAccessibleName("c8, white pawn");
    expect(traces()).toEqual(settled);
  });
});

describe("a finger on a placed piece, with another piece selected", () => {
  const finger = { pointerId: 11, isPrimary: true, button: 0, pointerType: "touch" };
  // A phone sends the click for a tap in a task of its own, after the release.
  const browserClickLater = () => act(() => new Promise((resolve) => setTimeout(resolve, 50)));

  function press(square: SquareName, dx: number) {
    const start = pointOf(square);
    const end = { clientX: start.clientX + dx, clientY: start.clientY };
    fireEvent.pointerDown(cell(square), { ...finger, ...start });
    fireEvent.pointerMove(cell(square), { ...finger, ...end });
    fireEvent.pointerUp(cell(square), { ...finger, ...end });
  }

  it("counts a 10px wobble as one tap, which puts the selected piece there", async () => {
    renderWithIntl(<Round initial={rebuilding({ type: "place", piece: { color: "black", type: "rook" }, square: "c8", now: 2000 })} />);
    fireEvent.click(palette("white pawn"));

    press("c8", 10);
    await browserClickLater();
    fireEvent.click(cell("c8"));

    expect(cell("c8")).toHaveAccessibleName("c8, white pawn");
    expect(cell("d8")).toHaveAccessibleName("d8, empty");
  });

  it("counts a 24px slide as one drag, and swallows the click that arrives after it", async () => {
    renderWithIntl(<Round initial={rebuilding({ type: "place", piece: { color: "black", type: "rook" }, square: "c8", now: 2000 })} />);
    fireEvent.click(palette("white pawn"));

    press("c8", 24);
    await browserClickLater();
    fireEvent.click(cell("c8"));

    expect(cell("e8")).toHaveAccessibleName("e8, black rook");
    expect(cell("c8")).toHaveAccessibleName("c8, empty");
  });
});
