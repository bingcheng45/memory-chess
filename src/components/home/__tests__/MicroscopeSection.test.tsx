import { act, renderWithIntl, screen, within } from "@/test-utils/intl";
import { MicroscopeSection } from "@/components/home/MicroscopeSection";

const STEP = { study: 0, chunk: 1, blank: 2, rebuild: 3, score: 4 } as const;

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

function ghostPieces(container: HTMLElement) {
  return container.querySelectorAll('.lab-scope-fig [data-state="ghost"]');
}

function overlayLayers(container: HTMLElement) {
  const [relations, chunks, groupA] = Array.from(container.querySelectorAll<SVGGElement>("svg.lab-ov > g"));
  return {
    relations: relations.hasAttribute("data-on"),
    chunks: chunks.hasAttribute("data-on"),
    groupA: groupA.hasAttribute("data-on"),
  };
}

afterEach(() => {
  globalThis.IntersectionObserver = originalObserver;
});

describe("MicroscopeSection", () => {
  it("walks the five phases of a round in order", () => {
    renderWithIntl(<MicroscopeSection />);

    const titles = screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent);
    expect(titles).toEqual([
      "Look for how pieces relate.",
      "Eight pieces become three groups.",
      "The board clears.",
      "Rebuild one group at a time.",
      "Read the result. Run it again.",
    ]);
  });

  it("numbers the steps from the phase table, with Rebuild as phase 04", () => {
    renderWithIntl(<MicroscopeSection />);

    const labels = screen.getAllByText(/^Phase 0\d \/ /).map((label) => label.textContent);
    // The sticky figure repeats the current step's label above the step list.
    expect(labels.slice(1)).toEqual([
      "Phase 01 / Study",
      "Phase 02 / Chunk",
      "Phase 03 / Blank",
      "Phase 04 / Rebuild",
      "Phase 05 / Score",
    ]);
  });

  it("no longer claims what the figure does not show", () => {
    const { container } = renderWithIntl(<MicroscopeSection />);

    expect(container).not.toHaveTextContent("loudest features");
    expect(container).not.toHaveTextContent("square by square");
    expect(container).not.toHaveTextContent("under tension");
    expect(container).not.toHaveTextContent("outside a clean chunk");
  });

  it("states the research claims as one study's finding, not as settled fact", () => {
    const { container } = renderWithIntl(<MicroscopeSection />);

    expect(container).toHaveTextContent("One chess-memory study estimates that people hold no more than about three chunks");
    expect(container).toHaveTextContent("One way to hold them is to name each one");
    expect(container).toHaveTextContent("In a classic chess-recall study, players put pieces back in quick bursts");
    expect(container).not.toHaveTextContent("Studies of chess recall find");
    expect(container).not.toHaveTextContent("pausing two seconds or more");
  });

  it("labels the three groups", () => {
    const { container } = renderWithIntl(<MicroscopeSection />);
    const figure = container.querySelector<HTMLElement>(".lab-scope-fig")!;

    expect(within(figure).getByText("A · Corner ×5")).toBeInTheDocument();
    expect(within(figure).getByText("B · File pair ×2")).toBeInTheDocument();
    expect(within(figure).getByText("C · Lone ×1")).toBeInTheDocument();
  });

  it("joins each related pair of pieces with a line at the squares' centres", () => {
    const { container } = renderWithIntl(<MicroscopeSection />);
    const lines = Array.from(container.querySelectorAll("line")).map((line) => ({
      x1: line.getAttribute("x1"),
      y1: line.getAttribute("y1"),
      x2: line.getAttribute("x2"),
      y2: line.getAttribute("y2"),
    }));

    expect(lines).toEqual([
      { x1: "3.5", y1: "0.5", x2: "3.5", y2: "2.5" }, // d8-d6
      { x1: "5.5", y1: "6.5", x2: "6.5", y2: "6.5" }, // f2-g2
      { x1: "6.5", y1: "6.5", x2: "7.5", y2: "6.5" }, // g2-h2
      { x1: "6.5", y1: "7.5", x2: "6.5", y2: "6.5" }, // g1-g2
      { x1: "5.5", y1: "5.5", x2: "6.5", y2: "6.5" }, // f3-g2
    ]);
  });

  it("shows only the relations layer on the first step", () => {
    const { container } = renderScrollable();

    expect(overlayLayers(container)).toEqual({ relations: true, chunks: false, groupA: false });
  });

  it("swaps the relations for the three groups when Chunk is in view", () => {
    const { container } = renderScrollable();
    scrollTo(container, STEP.chunk);

    expect(overlayLayers(container)).toEqual({ relations: false, chunks: true, groupA: false });
  });

  it("outlines group A alone when Score is in view", () => {
    const { container } = renderScrollable();
    scrollTo(container, STEP.score);

    expect(overlayLayers(container)).toEqual({ relations: false, chunks: false, groupA: true });
  });

  it("marks no piece as a ghost while the board is rebuilt, before it is submitted", () => {
    const { container } = renderScrollable();
    scrollTo(container, STEP.rebuild);

    expect(container.querySelector(".lab-scope-card")).toHaveAttribute("data-phase", "rebuild");
    expect(container.querySelectorAll('.lab-scope-fig [data-state="on"]')).toHaveLength(8);
    expect(ghostPieces(container)).toHaveLength(0);
  });

  it("ghosts the knight's true square once the round is scored", () => {
    const { container } = renderScrollable();
    scrollTo(container, STEP.score);

    expect(container.querySelector(".lab-scope-card")).toHaveAttribute("data-phase", "score");
    expect(container.querySelectorAll('.lab-scope-fig [data-state="on"]')).toHaveLength(8);
    expect(ghostPieces(container)).toHaveLength(1);
  });
});
