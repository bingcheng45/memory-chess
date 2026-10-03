import { Suspense, use } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import TypedBody from "@/components/articles/TypedBody";
import { announceArrival, clearArrival, peekArrival } from "@/components/articles/articleArrival";
import { setReducedMotion } from "@/components/articles/__tests__/reducedMotion";

const SLUG = "alder-fixture";
const SECTIONS = [
  {
    heading: "First heading",
    paragraphs: ["The first paragraph of the first section runs a little longer.", "A second paragraph."],
  },
  { heading: "Second heading", paragraphs: ["The only paragraph of the second section."] },
] as const;
const BLOCKS = SECTIONS.flatMap((section) => [section.heading, ...section.paragraphs]);
const FULL_TEXT = BLOCKS.join("");
const FRAME_MS = 16;
const LONGER_THAN_THE_WHOLE_BODY_MS = 4000;
const BLOCK_BOUNDARY_MS = 600;

const body = () => document.querySelector("[data-article-body]") as HTMLElement;
const phase = () => body().getAttribute("data-article-typing");
const showAll = () => screen.queryByRole("button", { name: "Show all text" });
const untyped = () => Array.from(body().querySelectorAll(".article-untyped"));
const shownLength = () =>
  FULL_TEXT.length - untyped().reduce((total, span) => total + (span.textContent ?? "").length, 0);

function partlyTypedBlock(): number | null {
  const block = body().querySelector(".article-caret")?.parentElement;
  if (!block) return null;
  const [shown, , rest] = Array.from(block.children);
  const isPartlyTyped = shown.textContent !== "" && rest.textContent !== "";
  return isPartlyTyped ? Array.from(body().children).indexOf(block) : null;
}

async function typeFor(ms: number, afterEachFrame: () => void = () => {}) {
  for (let elapsed = 0; elapsed < ms; elapsed += FRAME_MS) {
    await act(async () => {
      jest.advanceTimersByTime(FRAME_MS);
    });
    afterEachFrame();
  }
}

function renderBody(options?: Parameters<typeof render>[1]) {
  return render(<TypedBody slug={SLUG} sections={SECTIONS} />, options);
}

function expectFullPlainText() {
  expect(untyped()).toHaveLength(0);
  expect(body().querySelector(".article-caret")).toBeNull();
  expect(showAll()).not.toBeInTheDocument();
  expect(Array.from(body().children).map((block) => block.tagName)).toEqual(["H2", "P", "P", "H2", "P"]);
  expect(Array.from(body().children).map((block) => block.textContent)).toEqual(BLOCKS);
  for (const block of body().children) {
    expect(block.children).toHaveLength(0);
  }
}

function placeBlocksAt(rect: { top: number; bottom: number }) {
  return jest.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue(rect as DOMRect);
}

beforeEach(() => {
  jest.useFakeTimers();
  setReducedMotion(false);
});

afterEach(() => {
  clearArrival();
  jest.restoreAllMocks();
  jest.useRealTimers();
});

describe("TypedBody on a direct load", () => {
  it("shows the full text with no split, no caret and no button", () => {
    renderBody();

    expect(phase()).toBe("idle");
    expectFullPlainText();
  });
});

describe("TypedBody after a click on a card", () => {
  beforeEach(() => {
    announceArrival(SLUG, Promise.resolve());
  });

  it("starts with no character shown and every character still in the page", () => {
    renderBody();

    expect(phase()).toBe("typing");
    expect(shownLength()).toBe(0);
    expect(body().textContent).toBe(FULL_TEXT);
    expect(showAll()).not.toBeInTheDocument();
  });

  it("hides the text with a class, never with an attribute or an inline style", () => {
    const { container } = renderBody();

    expect(untyped().length).toBeGreaterThan(0);
    expect(container.querySelectorAll("[hidden], [style]")).toHaveLength(0);
  });

  it("keeps the text out of aria-hidden, which only the caret carries", () => {
    const { container } = renderBody();
    const ariaHidden = Array.from(container.querySelectorAll("[aria-hidden]"));

    expect(ariaHidden).toHaveLength(1);
    expect(ariaHidden[0]).toHaveClass("article-caret");
    expect(ariaHidden[0]).toHaveAttribute("aria-hidden", "true");
    expect(ariaHidden[0].textContent).toBe("");
  });

  it("types forward, block by block, until the full text is plain again", async () => {
    renderBody();

    await typeFor(200);
    const early = shownLength();
    expect(early).toBeGreaterThan(0);
    expect(early).toBeLessThan(FULL_TEXT.length);
    expect(body().textContent).toBe(FULL_TEXT);

    await typeFor(400);
    expect(shownLength()).toBeGreaterThan(early);
    expect(body().textContent).toBe(FULL_TEXT);

    await typeFor(LONGER_THAN_THE_WHOLE_BODY_MS);
    expect(phase()).toBe("done");
    expectFullPlainText();
  });

  it("shows the typed part of the current block first, then the caret, then the rest", async () => {
    renderBody();

    await typeFor(100);
    const [heading] = Array.from(body().children);
    const [shown, caret, rest] = Array.from(heading.children);

    expect(heading.children).toHaveLength(3);
    expect(caret).toHaveClass("article-caret");
    expect(rest).toHaveClass("article-untyped");
    expect((shown.textContent ?? "").length).toBeGreaterThan(0);
    expect(`${shown.textContent}${rest.textContent}`).toBe(SECTIONS[0].heading);
  });

  it("completes at once on Show all text, and the button goes", async () => {
    renderBody();
    await typeFor(100);

    fireEvent.click(showAll()!);

    expect(phase()).toBe("done");
    expectFullPlainText();
  });

  it("moves focus to the text on a press, even in a browser that does not focus a pressed button", async () => {
    renderBody();
    await typeFor(100);

    fireEvent.click(showAll()!);

    expect(document.activeElement).toBe(body());
  });

  it("moves focus to the text when typing ends on its own while the button holds focus", async () => {
    renderBody();
    await typeFor(100);
    showAll()!.focus();

    await typeFor(BLOCK_BOUNDARY_MS);
    expect(phase()).toBe("typing");
    expect(document.activeElement).toBe(showAll());

    await typeFor(LONGER_THAN_THE_WHOLE_BODY_MS);
    expect(phase()).toBe("done");
    expect(document.activeElement).toBe(body());
  });

  it("moves focus to the text when a hidden tab completes it while the button holds focus", async () => {
    renderBody();
    await typeFor(100);
    showAll()!.focus();

    jest.spyOn(document, "hidden", "get").mockReturnValue(true);
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(phase()).toBe("done");
    expect(document.activeElement).toBe(body());
  });

  it("leaves focus where the reader put it when typing ends and the button did not hold it", async () => {
    render(
      <>
        <button type="button">Elsewhere</button>
        <TypedBody slug={SLUG} sections={SECTIONS} />
      </>,
    );
    const elsewhere = screen.getByRole("button", { name: "Elsewhere" });
    await typeFor(100);
    elsewhere.focus();

    await typeFor(LONGER_THAN_THE_WHOLE_BODY_MS);

    expect(phase()).toBe("done");
    expect(document.activeElement).toBe(elsewhere);
  });

  it("offers Show all text as a real button a keyboard can reach", async () => {
    renderBody();
    await typeFor(100);

    expect(showAll()).toHaveAttribute("type", "button");
    expect(showAll()).not.toHaveAttribute("tabindex", "-1");
    expect(showAll()).not.toBeDisabled();
  });

  it("shows the full text at once under reduced motion", () => {
    setReducedMotion(true);

    renderBody();

    expect(phase()).toBe("idle");
    expectFullPlainText();
  });

  it("types every block under React StrictMode, each one part by part and none skipped", async () => {
    renderBody({ reactStrictMode: true });
    const seenPartlyTyped = new Set<number>();

    expect(phase()).toBe("typing");
    expect(shownLength()).toBe(0);

    await typeFor(LONGER_THAN_THE_WHOLE_BODY_MS, () => {
      const block = partlyTypedBlock();
      if (block !== null) seenPartlyTyped.add(block);
    });

    expect(Array.from(seenPartlyTyped)).toEqual(BLOCKS.map((_, index) => index));
    expect(phase()).toBe("done");
    expectFullPlainText();
  });

  it("still types when React throws the first render away before it commits", async () => {
    let finishLoading = () => {};
    const loading = new Promise<void>((resolve) => {
      finishLoading = resolve;
    });
    function SlowSibling() {
      use(loading);
      return null;
    }

    await act(async () => {
      render(
        <Suspense fallback={<p>Loading</p>}>
          <TypedBody slug={SLUG} sections={SECTIONS} />
          <SlowSibling />
        </Suspense>,
      );
    });
    expect(screen.getByText("Loading")).toBeInTheDocument();

    await act(async () => {
      finishLoading();
    });

    expect(screen.queryByText("Loading")).not.toBeInTheDocument();
    expect(phase()).toBe("typing");
    await typeFor(100);
    expect(showAll()).toBeInTheDocument();
  });

  it("is used up by the article that typed, so the same article opened again shows its text at once", () => {
    const first = renderBody();
    expect(phase()).toBe("typing");
    expect(peekArrival(SLUG)).toBeNull();
    first.unmount();

    renderBody();

    expect(phase()).toBe("idle");
    expectFullPlainText();
  });

  it("waits for the page transition to finish before the first character", async () => {
    let land = () => {};
    announceArrival(
      SLUG,
      new Promise<void>((resolve) => {
        land = resolve;
      }),
    );
    renderBody();

    await typeFor(500);
    expect(shownLength()).toBe(0);
    expect(showAll()).not.toBeInTheDocument();

    land();
    await typeFor(200);
    expect(shownLength()).toBeGreaterThan(0);
    expect(showAll()).toBeInTheDocument();
  });

  it("holds a block whose top is still below the viewport", async () => {
    const placement = placeBlocksAt({ top: window.innerHeight + 500, bottom: window.innerHeight + 600 });
    renderBody();

    await typeFor(500);
    expect(shownLength()).toBe(0);
    expect(showAll()).not.toBeInTheDocument();

    placement.mockReturnValue({ top: 100, bottom: 200 } as DOMRect);
    await typeFor(500);
    expect(shownLength()).toBeGreaterThan(0);
    expect(showAll()).toBeInTheDocument();
  });

  it("types the first block without starting it over when the button appears", async () => {
    renderBody();
    const lengths: number[] = [];

    await typeFor(6 * FRAME_MS, () => lengths.push(shownLength()));

    expect(lengths).toEqual([...lengths].sort((a, b) => a - b));
    expect(lengths.at(-1)).toBeGreaterThanOrEqual(9);
  });

  it("finishes blocks the reader has scrolled past without typing them out", async () => {
    placeBlocksAt({ top: -600, bottom: -500 });
    renderBody();

    await typeFor(BLOCKS.length * FRAME_MS * 3);

    expect(phase()).toBe("done");
    expectFullPlainText();
  });

  it("completes at once when the tab is hidden", async () => {
    renderBody();
    await typeFor(100);

    jest.spyOn(document, "hidden", "get").mockReturnValue(true);
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(phase()).toBe("done");
    expectFullPlainText();
  });

  it("asks for no more animation frames once the reader leaves mid-article", async () => {
    const { unmount } = renderBody();
    await typeFor(100);

    unmount();
    const request = jest.spyOn(window, "requestAnimationFrame");
    await typeFor(600);

    expect(request).not.toHaveBeenCalled();
  });

  it("checks a waiting block a few times a second, not on every frame", async () => {
    placeBlocksAt({ top: window.innerHeight + 500, bottom: window.innerHeight + 600 });
    renderBody();
    await typeFor(100);
    const request = jest.spyOn(window, "requestAnimationFrame");

    await typeFor(1000);

    expect(request.mock.calls.length).toBeGreaterThan(0);
    expect(request.mock.calls.length).toBeLessThan(10);
  });
});

describe("TypedBody when the announcement was for another article", () => {
  it("shows the full text and drops the stale announcement", () => {
    announceArrival("birch-fixture", Promise.resolve());

    renderBody();

    expect(phase()).toBe("idle");
    expectFullPlainText();
    expect(peekArrival("birch-fixture")).toBeNull();
  });
});
