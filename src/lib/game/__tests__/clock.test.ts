import {
  deadlineFrom,
  elapsedMs,
  fireAtDeadline,
  now,
  remainingMs,
  subscribe,
  type Monotonic,
} from "@/lib/game/clock";
import { formatTimeWithMilliseconds } from "@/utils/timer";

const at = (ms: number) => ms as Monotonic;

let pendingFrames: Map<number, () => void>;
let nextFrameId: number;
let clock: number;
let cancelFrame: jest.Mock;

beforeEach(() => {
  pendingFrames = new Map();
  nextFrameId = 1;
  clock = 1_000;
  jest.spyOn(performance, "now").mockImplementation(() => clock);
  global.requestAnimationFrame = ((callback: FrameRequestCallback) => {
    const id = nextFrameId++;
    pendingFrames.set(id, () => callback(clock));
    return id;
  }) as typeof requestAnimationFrame;
  cancelFrame = jest.fn((id: number) => {
    pendingFrames.delete(id);
  });
  global.cancelAnimationFrame = cancelFrame as unknown as typeof cancelAnimationFrame;
});

afterEach(() => {
  jest.restoreAllMocks();
});

function advanceTo(ms: number) {
  clock = ms;
  const due = [...pendingFrames.values()];
  pendingFrames.clear();
  for (const frame of due) frame();
}

describe("remainingMs", () => {
  it("counts down to the deadline", () => {
    expect(remainingMs(at(3_000), at(1_000))).toBe(2_000);
    expect(remainingMs(at(3_000), at(2_500))).toBe(500);
  });

  it("never goes negative once the deadline has passed", () => {
    expect(remainingMs(at(3_000), at(3_000))).toBe(0);
    expect(remainingMs(at(3_000), at(9_999))).toBe(0);
  });
});

describe("elapsedMs", () => {
  it("is monotonic across a rising clock", () => {
    const startedAt = at(500);
    const readings = [500, 501, 900, 12_345].map((ms) => elapsedMs(startedAt, at(ms)));

    expect(readings).toEqual([0, 1, 400, 11_845]);
    expect([...readings].sort((a, b) => a - b)).toEqual(readings);
  });

  it("never goes negative for an instant before the start", () => {
    expect(elapsedMs(at(500), at(499))).toBe(0);
  });
});

describe("deadlineFrom", () => {
  it("places the deadline one duration after the start", () => {
    expect(remainingMs(deadlineFrom(at(1_000), 2_000), at(1_000))).toBe(2_000);
  });
});

describe("display derivation", () => {
  it("splits remaining time into the seconds and hundredths the countdown shows", () => {
    const deadline = deadlineFrom(at(0), 2_000);
    const split = (ms: number) => {
      const remaining = remainingMs(deadline, at(ms));
      return [Math.floor(remaining / 1000), Math.floor((remaining % 1000) / 10)];
    };

    expect(split(0)).toEqual([2, 0]);
    expect(split(1_234)).toEqual([0, 76]);
    expect(split(2_000)).toEqual([0, 0]);
    expect(split(2_500)).toEqual([0, 0]);
  });

  it("formats elapsed time exactly as the count-up already did", () => {
    const startedAt = at(1_000);

    expect(formatTimeWithMilliseconds(elapsedMs(startedAt, at(1_000)) / 1000)).toBe("00:00.000");
    expect(formatTimeWithMilliseconds(elapsedMs(startedAt, at(4_567)) / 1000)).toBe("00:03.567");
    expect(formatTimeWithMilliseconds(elapsedMs(startedAt, at(76_050)) / 1000)).toBe("01:15.050");
  });
});

describe("fireAtDeadline", () => {
  it("does not fire before the deadline", () => {
    const fire = jest.fn();
    const handler = fireAtDeadline(at(3_000), fire);

    handler(at(1_000));
    handler(at(2_999));

    expect(fire).not.toHaveBeenCalled();
  });

  it("fires exactly once from the deadline onwards", () => {
    const fire = jest.fn();
    const handler = fireAtDeadline(at(3_000), fire);

    handler(at(3_000));
    handler(at(3_016));
    handler(at(4_000));

    expect(fire).toHaveBeenCalledTimes(1);
  });

  it("still fires once when the first frame arrives long after a stalled tab", () => {
    const fire = jest.fn();
    const handler = fireAtDeadline(at(3_000), fire);

    handler(at(1_000));
    handler(at(45_000));
    handler(at(46_000));

    expect(fire).toHaveBeenCalledTimes(1);
  });
});

describe("subscribe", () => {
  it("hands every subscriber the same frame instant from one loop", () => {
    const first: number[] = [];
    const second: number[] = [];
    const stopFirst = subscribe((instant) => first.push(instant));
    const stopSecond = subscribe((instant) => second.push(instant));

    advanceTo(1_016);
    advanceTo(1_033);

    expect(first).toEqual([1_016, 1_033]);
    expect(second).toEqual(first);

    stopFirst();
    stopSecond();
  });

  it("stops the loop once the last subscriber leaves", () => {
    const handler = jest.fn();
    const stop = subscribe(handler);

    advanceTo(1_016);
    stop();
    advanceTo(1_033);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(cancelFrame).toHaveBeenCalled();
    expect(pendingFrames.size).toBe(0);
  });

  it("ends the phase exactly once at the deadline while painting every frame", () => {
    const deadline = deadlineFrom(now(), 2_000);
    const painted: number[] = [];
    const endPhase = jest.fn();
    const atDeadline = fireAtDeadline(deadline, endPhase);
    const stop = subscribe((instant) => {
      painted.push(remainingMs(deadline, instant));
      atDeadline(instant);
    });

    advanceTo(2_000);
    advanceTo(2_990);
    advanceTo(3_000);
    advanceTo(3_016);
    stop();

    expect(painted).toEqual([1_000, 10, 0, 0]);
    expect(endPhase).toHaveBeenCalledTimes(1);
  });

  it("asks for a new frame when the tab wakes up with a dropped one", () => {
    const handler = jest.fn();
    const stop = subscribe(handler);

    advanceTo(1_016);
    pendingFrames.clear();
    clock = 40_000;
    document.dispatchEvent(new Event("visibilitychange"));
    advanceTo(40_016);

    expect(handler).toHaveBeenCalledTimes(2);
    expect(handler).toHaveBeenLastCalledWith(40_016);

    stop();
  });

  it("leaves the loop alone while the tab is still hidden", () => {
    const handler = jest.fn();
    const stop = subscribe(handler);
    advanceTo(1_016);

    const visibility = jest.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    pendingFrames.clear();
    document.dispatchEvent(new Event("visibilitychange"));

    expect(pendingFrames.size).toBe(0);

    visibility.mockRestore();
    stop();
  });

  it("stops listening for wake-ups once the last subscriber leaves", () => {
    const handler = jest.fn();
    subscribe(handler)();

    pendingFrames.clear();
    document.dispatchEvent(new Event("visibilitychange"));

    expect(pendingFrames.size).toBe(0);
  });

  it("ends the phase once when the tab wakes up past the deadline", () => {
    const deadline = deadlineFrom(now(), 2_000);
    const endPhase = jest.fn();
    const atDeadline = fireAtDeadline(deadline, endPhase);
    const painted: number[] = [];
    const stop = subscribe((instant) => {
      painted.push(remainingMs(deadline, instant));
      atDeadline(instant);
    });

    advanceTo(30_000);
    advanceTo(30_016);
    stop();

    expect(painted).toEqual([0, 0]);
    expect(endPhase).toHaveBeenCalledTimes(1);
  });
});
