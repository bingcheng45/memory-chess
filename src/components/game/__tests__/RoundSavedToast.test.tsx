import { useRef } from "react";
import { act, fireEvent, render, screen } from "@/test-utils/intl";
import RoundSavedToast, { ROUND_SAVED_TOAST_MS } from "@/components/game/RoundSavedToast";

const MESSAGE = "Round saved. Your updated stats are just below.";

function placeSections(top: number) {
  jest.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ top, bottom: top + 300 } as DOMRect);
}

function Result({ roundId, feedbackAsked = false }: { roundId: string; feedbackAsked?: boolean }) {
  const section = useRef<HTMLElement>(null);
  return (
    <section ref={section} tabIndex={-1} aria-label="Your dashboard after this round">
      <RoundSavedToast roundId={roundId} target={section} feedbackAsked={feedbackAsked} />
    </section>
  );
}

let scrolled: jest.Mock;
let reducedMotion: boolean;

beforeEach(() => {
  jest.useFakeTimers();
  scrolled = jest.fn();
  reducedMotion = false;
  Element.prototype.scrollIntoView = scrolled;
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({ matches: reducedMotion && query.includes("reduce") }));
});

afterEach(() => {
  window.localStorage.clear();
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe("RoundSavedToast", () => {
  it("says the round is saved, politely, when the figures start below the fold", () => {
    placeSections(1200);
    render(<Result roundId="shown" />);

    expect(screen.getByRole("status")).toHaveTextContent(`${MESSAGE}Show me`);
  });

  it("stays quiet when the feedback prompt is about to open, so the two never stack", () => {
    placeSections(1200);
    render(<Result roundId="feedback-due" feedbackAsked />);

    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("leaves after three seconds", () => {
    placeSections(1200);
    render(<Result roundId="timed" />);

    act(() => jest.advanceTimersByTime(ROUND_SAVED_TOAST_MS - 1));
    expect(screen.getByRole("status")).toHaveTextContent(MESSAGE);
    act(() => jest.advanceTimersByTime(1));
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("stays while hovered or focused and leaves three seconds after the pointer goes", () => {
    placeSections(1200);
    render(<Result roundId="paused" />);
    const chip = screen.getByText(MESSAGE).parentElement as HTMLElement;

    fireEvent.mouseEnter(chip);
    act(() => jest.advanceTimersByTime(10_000));
    expect(screen.getByRole("status")).toHaveTextContent(MESSAGE);

    fireEvent.focus(screen.getByRole("button", { name: "Show me" }));
    fireEvent.mouseLeave(chip);
    act(() => jest.advanceTimersByTime(10_000));
    expect(screen.getByRole("status")).toHaveTextContent(MESSAGE);

    fireEvent.blur(screen.getByRole("button", { name: "Show me" }));
    act(() => jest.advanceTimersByTime(ROUND_SAVED_TOAST_MS));
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("leaves on Escape", () => {
    placeSections(1200);
    render(<Result roundId="escaped" />);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("scrolls to the figures and focuses them on Show me, smoothly or at once under reduced motion", () => {
    placeSections(1200);
    render(<Result roundId="smooth" />);
    fireEvent.click(screen.getByRole("button", { name: "Show me" }));

    const section = screen.getByRole("region", { name: "Your dashboard after this round" });
    expect(scrolled.mock.contexts[0]).toBe(section);
    expect(scrolled).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
    expect(section).toHaveFocus();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();

    reducedMotion = true;
    render(<Result roundId="still" />);
    fireEvent.click(screen.getByRole("button", { name: "Show me" }));
    expect(scrolled).toHaveBeenLastCalledWith({ behavior: "auto", block: "start" });
  });

  it("stays quiet when the figures are already on screen", () => {
    placeSections(400);
    render(<Result roundId="in-view" />);

    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("speaks once per round, not again when the same round's result is drawn again", () => {
    placeSections(1200);
    const first = render(<Result roundId="again" />);
    act(() => jest.advanceTimersByTime(ROUND_SAVED_TOAST_MS));
    first.unmount();

    render(<Result roundId="again" />);
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });
});
