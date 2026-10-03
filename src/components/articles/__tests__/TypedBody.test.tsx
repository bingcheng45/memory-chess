import { Suspense, use } from "react";
import { act, render, screen } from "@testing-library/react";
import TypedBody from "@/components/articles/TypedBody";
import { announceArrival, peekArrival } from "@/components/articles/articleArrival";
import { setReducedMotion } from "@/components/articles/__tests__/reducedMotion";
import {
  BLOCKS,
  FRAME_MS,
  FULL_TEXT,
  LONGER_THAN_THE_WHOLE_BODY_MS,
  SECTIONS,
  SLUG,
  body,
  expectFullPlainText,
  partlyTypedBlock,
  phase,
  placeBlocksAt,
  renderBody,
  showAll,
  shownLength,
  typeFor,
  untyped,
  withFakeFrames,
} from "@/components/articles/__tests__/typedBodyHarness";

const CLEF_CODE_POINT = 0x1d11e;

withFakeFrames();

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

  it("never shows half of a character that takes two UTF-16 units", async () => {
    const clef = String.fromCodePoint(CLEF_CODE_POINT);
    const sections = [{ heading: clef.repeat(12), paragraphs: [`Notes ${clef.repeat(20)} end.`] }];
    render(<TypedBody slug={SLUG} sections={sections} />);
    const brokenSpans: string[] = [];

    await typeFor(LONGER_THAN_THE_WHOLE_BODY_MS, () => {
      for (const span of body().querySelectorAll("span")) {
        if (!(span.textContent ?? "").isWellFormed()) brokenSpans.push(span.className || "shown");
      }
    });

    expect(brokenSpans).toEqual([]);
    expect(phase()).toBe("done");
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

  it("stops checking a waiting block once the reader leaves", async () => {
    placeBlocksAt({ top: window.innerHeight + 500, bottom: window.innerHeight + 600 });
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
