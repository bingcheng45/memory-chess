import { act, render, screen } from "@testing-library/react";
import { useShowcaseClock } from "@/components/home/useShowcaseClock";

const STEPS = [{ durationMs: 1000 }, { durationMs: 2000 }, { durationMs: 500 }];

function mockReducedMotion(matches: boolean) {
  window.matchMedia = jest.fn().mockImplementation(() => ({
    matches,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  }));
}

function Probe({ hold = false }: { hold?: boolean }) {
  const clock = useShowcaseClock(STEPS, hold);
  return (
    <figure ref={clock.ref}>
      <output>{clock.index}</output>
      <button onClick={clock.toggle}>toggle</button>
      <button onClick={() => clock.go(-1)}>last</button>
      <button onClick={() => clock.go(4)}>wrap</button>
      <button onClick={clock.play}>play</button>
    </figure>
  );
}

let notify: (isIntersecting: boolean) => void;

function mockObserver() {
  window.IntersectionObserver = jest.fn().mockImplementation((callback: IntersectionObserverCallback) => {
    notify = (isIntersecting) =>
      act(() => callback([{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver));
    return { observe: jest.fn(), disconnect: jest.fn() };
  }) as unknown as typeof IntersectionObserver;
}

const step = (ms: number) => act(() => void jest.advanceTimersByTime(ms));
const at = () => screen.getByRole("status").textContent;

describe("useShowcaseClock", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockReducedMotion(false);
    mockObserver();
  });
  afterEach(() => jest.useRealTimers());

  it("advances each step after its own duration and wraps to the first", () => {
    render(<Probe />);
    notify(true);
    expect(at()).toBe("0");
    step(1000);
    expect(at()).toBe("1");
    step(1999);
    expect(at()).toBe("1");
    step(1);
    expect(at()).toBe("2");
    step(500);
    expect(at()).toBe("0");
  });

  it("stops on Pause and goes on when played again", () => {
    render(<Probe />);
    notify(true);
    act(() => screen.getByText("toggle").click());
    step(5000);
    expect(at()).toBe("0");
    act(() => screen.getByText("toggle").click());
    step(1000);
    expect(at()).toBe("1");
  });

  it("stands still while held", () => {
    const { rerender } = render(<Probe hold />);
    notify(true);
    step(5000);
    expect(at()).toBe("0");
    rerender(<Probe />);
    step(1000);
    expect(at()).toBe("1");
  });

  it("wraps manual jumps in both directions", () => {
    render(<Probe />);
    act(() => screen.getByText("last").click());
    expect(at()).toBe("2");
    act(() => screen.getByText("wrap").click());
    expect(at()).toBe("1");
  });

  it("does not autoplay under reduced motion, but plays when asked", () => {
    mockReducedMotion(true);
    render(<Probe />);
    notify(true);
    step(5000);
    expect(at()).toBe("0");
    act(() => screen.getByText("play").click());
    step(1000);
    expect(at()).toBe("1");
  });

  it("waits while the card is off screen", () => {
    render(<Probe />);
    step(5000);
    expect(at()).toBe("0");
    notify(true);
    step(1000);
    expect(at()).toBe("1");
    notify(false);
    step(5000);
    expect(at()).toBe("1");
  });
});
