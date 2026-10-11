import { act, renderWithIntl, screen, within } from "@/test-utils/intl";
import { MicroscopeSection } from "@/components/home/MicroscopeSection";
import { MICROSCOPE_PHASES, type MicroscopePhaseId } from "@/lib/home/specimen";

const STEP = Object.fromEntries(MICROSCOPE_PHASES.map((phase, index) => [phase.id, index])) as Record<
  MicroscopePhaseId,
  number
>;

const originalObserver = globalThis.IntersectionObserver;
let reportIntersection: IntersectionObserverCallback = () => {};

class StubIntersectionObserver {
  constructor(callback: IntersectionObserverCallback) {
    reportIntersection = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

/** Plays the part of the scroll: reports one step as crossing the active band. */
function scrollTo(container: HTMLElement, step: number) {
  const target = container.querySelector(`.lab-step[data-step="${step}"]`)!;
  const entry = { isIntersecting: true, target } as unknown as IntersectionObserverEntry;
  act(() => reportIntersection([entry], {} as IntersectionObserver));
}

function renderScrollable() {
  globalThis.IntersectionObserver = StubIntersectionObserver as unknown as typeof IntersectionObserver;
  return renderWithIntl(<MicroscopeSection />);
}

const figure = (container: HTMLElement) => container.querySelector<HTMLElement>(".lab-scope-fig")!;
const pieces = (container: HTMLElement, state: string) =>
  figure(container).querySelectorAll(`.lab-piece[data-state="${state}"]`).length;
const count = (container: HTMLElement, selector: string) => figure(container).querySelectorAll(selector).length;

afterEach(() => {
  globalThis.IntersectionObserver = originalObserver;
});

describe("MicroscopeSection", () => {
  it("walks the seven phases of a round in order", () => {
    renderWithIntl(<MicroscopeSection />);

    const titles = screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent);
    expect(titles).toEqual([
      "Eleven pieces, ten seconds.",
      "Start with the kings.",
      "Eleven pieces become three ideas.",
      "Turn each group into a sentence.",
      "The board clears.",
      "Rebuild group by group.",
      "Check it against your sentences, then score.",
    ]);
  });

  it("numbers the steps from the phase table", () => {
    renderWithIntl(<MicroscopeSection />);

    const labels = screen.getAllByText(/^Phase 0\d \/ /).map((label) => label.textContent);
    // The sticky figure repeats the current step's label above the step list.
    expect(labels.slice(1)).toEqual([
      "Phase 01 / Study",
      "Phase 02 / Anchors",
      "Phase 03 / Chunk",
      "Phase 04 / Encode",
      "Phase 05 / Blank",
      "Phase 06 / Rebuild",
      "Phase 07 / Score",
    ]);
  });

  it("cites only what the research found, and calls the sentences a technique", () => {
    const { container } = renderWithIntl(<MicroscopeSection />);

    expect(container).toHaveTextContent("In de Groot's experiments, masters reproduced a briefly shown game position");
    expect(container).toHaveTextContent("Chase and Simon (1973) found that strong players recall positions in chunks");
    expect(container).toHaveTextContent("Gobet and Simon (1996) describe strong players holding larger, schema-like structures");
    expect(container).toHaveTextContent("The sentences themselves are a technique, not a research finding.");
    expect(container).not.toHaveTextContent(/improve|percent better|\d+% better/i);
  });

  it("shows the whole position, unmarked, on the first step", () => {
    const { container } = renderScrollable();

    expect(pieces(container, "on")).toBe(11);
    expect(count(container, ".lab-ov-rel, .lab-ov-cell, .lab-ov-ring")).toBe(0);
  });

  it("rings the two kings and dims the rest for the anchors", () => {
    const { container } = renderScrollable();
    scrollTo(container, STEP.anchors);

    expect(count(container, ".lab-ov-ring")).toBe(2);
    expect(pieces(container, "on")).toBe(2);
    expect(pieces(container, "ghost")).toBe(9);
  });

  it("outlines three groups and draws what ties each together", () => {
    const { container } = renderScrollable();
    scrollTo(container, STEP.chunk);

    expect(count(container, ".lab-ov-cell")).toBe(14);
    expect(count(container, ".lab-ov-rel[data-kind='attacks']")).toBe(3);
    expect(count(container, ".lab-ov-rel[data-kind='defends']")).toBe(2);
    expect(count(container, ".lab-ov-rel[data-kind='chain']")).toBe(4);
    expect(count(container, ".lab-ov-rel[data-kind='blocked']")).toBe(1);
  });

  it("names the groups on the board and lists their sentences", () => {
    const { container } = renderScrollable();
    scrollTo(container, STEP.encode);

    expect(within(figure(container)).getByText("1 · Stand-off")).toBeInTheDocument();
    expect(within(figure(container)).getByText("2 · Stairs")).toBeInTheDocument();
    expect(within(figure(container)).getByText("3 · Long shots")).toBeInTheDocument();
    expect(screen.getByText(/White's king hits d2/)).toBeInTheDocument();
    expect(screen.getByText(/Mirror stairs, h2 up to f4, h7 down to f5/)).toBeInTheDocument();
  });

  it("rebuilds every piece, the c3 pawn on c2, group by group, unmarked", () => {
    const { container } = renderScrollable();
    scrollTo(container, STEP.rebuild);

    expect(container.querySelector(".lab-scope-card")).toHaveAttribute("data-phase", "rebuild");
    expect(pieces(container, "on")).toBe(11);
    expect(pieces(container, "ghost")).toBe(0);
    const reveal = (square: string) =>
      figure(container).querySelectorAll<HTMLElement>(".lab-cell")[["a", "b", "c", "d", "e", "f", "g", "h"].indexOf(square[0]) + (8 - Number(square[1])) * 8].style.getPropertyValue("--reveal");
    expect([reveal("c1"), reveal("e1"), reveal("d2"), reveal("c2"), reveal("f4"), reveal("a7")]).toEqual(["0", "0", "1", "1", "2", "3"]);
  });

  it("ticks every relation that still holds and crosses the one the slip broke", () => {
    const { container } = renderScrollable();
    scrollTo(container, STEP.score);

    expect(container.querySelector(".lab-scope-card")).toHaveAttribute("data-phase", "score");
    expect(count(container, ".lab-ov-verdict[data-holds='true']")).toBe(9);
    expect(count(container, ".lab-ov-verdict[data-holds='false']")).toBe(1);
    expect(pieces(container, "ghost")).toBe(1);
    expect(within(figure(container)).getByText(/White 5 · Black 6/)).toBeInTheDocument();
    expect(within(figure(container)).getByText("91%")).toBeInTheDocument();
    expect(screen.getByText(/10 of 11 squares is 91%\./)).toBeInTheDocument();
  });
});
