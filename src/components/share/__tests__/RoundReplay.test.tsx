import { act, render } from "@testing-library/react";
import { RoundReplay } from "@/components/share/RoundReplay";
import { sharePageOf } from "@/lib/share/sharePage";

const CODE = "1_g_4_100_84_383_1214_u14_3_4k3-8-8-3q4-8-8-4P3-4K3_4k3-8-8-8-8-8-8-R3K3_e86e110a110";

function sharedRound() {
  const round = sharePageOf("result", CODE)?.round;
  if (!round) throw new Error("the fixture code has no round");
  return round;
}

const clockOf = (container: HTMLElement) => (container.querySelector(".lab-replay-clock > span:last-child") as HTMLElement).textContent;

describe("RoundReplay clock", () => {
  it("reads '0.0 s of 8.4 s', with only the digits in the mono face", () => {
    const { container } = render(<RoundReplay round={sharedRound()} />);
    const clock = container.querySelector(".lab-replay-clock > span:last-child") as HTMLElement;

    expect(clock.textContent).toBe("0.0 s of 8.4 s");
    expect([...clock.querySelectorAll(".lab-mono")].map((digits) => digits.textContent)).toEqual(["0.0", "8.4"]);
  });
});

describe("RoundReplay out of view", () => {
  let now = 0;
  let frames: FrameRequestCallback[] = [];
  let sighted: IntersectionObserverCallback = () => {};

  beforeEach(() => {
    now = 0;
    frames = [];
    jest.spyOn(performance, "now").mockImplementation(() => now);
    jest.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => frames.push(callback));
    jest.spyOn(window, "cancelAnimationFrame").mockImplementation((id) => {
      frames[id - 1] = () => {};
    });
    window.IntersectionObserver = jest.fn((callback: IntersectionObserverCallback) => {
      sighted = callback;
      return { observe: jest.fn(), disconnect: jest.fn(), unobserve: jest.fn() };
    }) as unknown as typeof IntersectionObserver;
  });
  afterEach(() => jest.restoreAllMocks());

  const see = (isIntersecting: boolean) => act(() => sighted([{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver));
  const run = (ms: number) => {
    for (let frame = 0; frame < ms / 20; frame++) {
      now += 20;
      const due = frames;
      frames = [];
      act(() => due.forEach((callback) => callback(now)));
    }
  };

  it("holds its clock while scrolled out of view and resumes from the same second", () => {
    const { container } = render(<RoundReplay round={sharedRound()} />);

    see(true);
    run(1000);
    expect(clockOf(container)).toBe("2.0 s of 8.4 s");

    see(false);
    run(1000);
    expect(clockOf(container)).toBe("2.0 s of 8.4 s");

    see(true);
    run(500);
    expect(clockOf(container)).toBe("3.0 s of 8.4 s");
  });
});
