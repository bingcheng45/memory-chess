import { act, screen } from "@testing-library/react";
import TypedBody from "@/components/articles/TypedBody";
import { clearArrival } from "@/components/articles/articleArrival";
import { setReducedMotion } from "@/components/articles/__tests__/reducedMotion";
import { renderWithIntl } from "@/test-utils/intl";

export const SLUG = "alder-fixture";
export const SECTIONS = [
  {
    heading: "First heading",
    paragraphs: ["The first paragraph of the first section runs a little longer.", "A second paragraph."],
  },
  { heading: "Second heading", paragraphs: ["The only paragraph of the second section."] },
] as const;
export const BLOCKS = SECTIONS.flatMap((section) => [section.heading, ...section.paragraphs]);
export const FULL_TEXT = BLOCKS.join("");
export const FRAME_MS = 16;
export const LONGER_THAN_THE_WHOLE_BODY_MS = 4000;

export const body = () => document.querySelector("[data-article-body]") as HTMLElement;
export const phase = () => body().getAttribute("data-article-typing");
export const showAll = () => screen.queryByRole("button", { name: "Show all text" });
export const untyped = () => Array.from(body().querySelectorAll(".article-untyped"));
export const shownLength = () =>
  FULL_TEXT.length - untyped().reduce((total, span) => total + (span.textContent ?? "").length, 0);

export function partlyTypedBlock(): number | null {
  const block = body().querySelector(".article-caret")?.parentElement;
  if (!block) return null;
  const [shown, , rest] = Array.from(block.children);
  const isPartlyTyped = shown.textContent !== "" && rest.textContent !== "";
  return isPartlyTyped ? Array.from(body().children).indexOf(block) : null;
}

export async function typeFor(ms: number, afterEachFrame: () => void = () => {}) {
  for (let elapsed = 0; elapsed < ms; elapsed += FRAME_MS) {
    await act(async () => {
      jest.advanceTimersByTime(FRAME_MS);
    });
    afterEachFrame();
  }
}

export function renderBody(options?: Parameters<typeof renderWithIntl>[1]) {
  return renderWithIntl(<TypedBody slug={SLUG} sections={SECTIONS} />, options);
}

export function expectFullPlainText() {
  expect(untyped()).toHaveLength(0);
  expect(body().querySelector(".article-caret")).toBeNull();
  expect(showAll()).not.toBeInTheDocument();
  expect(Array.from(body().children).map((block) => block.tagName)).toEqual(["H2", "P", "P", "H2", "P"]);
  expect(Array.from(body().children).map((block) => block.textContent)).toEqual(BLOCKS);
  for (const block of body().children) {
    expect(block.children).toHaveLength(0);
  }
}

export function placeBlocksAt(rect: { top: number; bottom: number }) {
  return jest.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue(rect as DOMRect);
}

export function withFakeFrames() {
  beforeEach(() => {
    jest.useFakeTimers();
    setReducedMotion(false);
  });

  afterEach(() => {
    clearArrival();
    jest.restoreAllMocks();
    jest.useRealTimers();
  });
}
