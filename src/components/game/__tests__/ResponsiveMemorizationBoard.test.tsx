import { act, render } from "@/test-utils/intl";
import ResponsiveMemorizationBoard from "@/components/game/ResponsiveMemorizationBoard";

const endMemorizationPhase = jest.fn();
const startSolutionPhase = jest.fn();
const playSound = jest.fn();
const stopTimerSound = jest.fn();

const gameState = {
  isMemorizationPhase: true,
  memorizeTime: 5,
  pieceCount: 4,
};

jest.mock("@/lib/store/gameStore", () => ({
  useGameStore: () => ({
    chess: null,
    gameState,
    endMemorizationPhase,
    startSolutionPhase,
  }),
}));

jest.mock("@/stores/settingsStore", () => ({
  useSettingsStore: () => false,
}));

jest.mock("@/lib/utils/soundEffects", () => ({
  playSound: (...args: unknown[]) => playSound(...args),
  stopTimerSound: (...args: unknown[]) => stopTimerSound(...args),
}));

let pendingFrames: Map<number, () => void>;
let nextFrameId: number;
let clock: number;

beforeEach(() => {
  jest.clearAllMocks();
  pendingFrames = new Map();
  nextFrameId = 1;
  clock = 10_000;
  jest.spyOn(performance, "now").mockImplementation(() => clock);
  global.requestAnimationFrame = ((callback: FrameRequestCallback) => {
    const id = nextFrameId++;
    pendingFrames.set(id, () => callback(clock));
    return id;
  }) as typeof requestAnimationFrame;
  global.cancelAnimationFrame = ((id: number) => {
    pendingFrames.delete(id);
  }) as typeof cancelAnimationFrame;
});

afterEach(() => {
  jest.restoreAllMocks();
});

function advanceBy(ms: number) {
  act(() => {
    clock += ms;
    const due = [...pendingFrames.values()];
    pendingFrames.clear();
    for (const frame of due) frame();
  });
}

const clockText = () => document.querySelector(".text-3xl")?.textContent;
const bar = () => document.querySelector<HTMLElement>(".origin-left");

describe("ResponsiveMemorizationBoard countdown", () => {
  it("paints the configured time before a single frame has run", () => {
    render(<ResponsiveMemorizationBoard />);

    expect(clockText()).toBe("5.00");
    expect(bar()?.style.transform).toBe("scaleX(0)");
  });

  it("repaints the clock and the bar every frame without re-rendering", () => {
    render(<ResponsiveMemorizationBoard />);

    advanceBy(1_000);
    expect(clockText()).toBe("4.00");
    expect(bar()?.style.transform).toBe("scaleX(0.2)");

    advanceBy(16);
    expect(clockText()).toBe("3.98");

    advanceBy(2_484);
    expect(clockText()).toBe("1.50");
    expect(bar()?.style.transform).toBe("scaleX(0.7)");
  });

  it("turns the clock red for the last three seconds", () => {
    render(<ResponsiveMemorizationBoard />);

    advanceBy(1_000);
    expect(document.querySelector(".text-3xl")?.className).toContain("text-orange-500");

    advanceBy(1_000);
    expect(document.querySelector(".text-3xl")?.className).toContain("text-red-500");
  });

  it("ends the phase exactly once, at the frame that paints zero", () => {
    render(<ResponsiveMemorizationBoard />);

    advanceBy(4_990);
    expect(endMemorizationPhase).not.toHaveBeenCalled();

    advanceBy(10);
    expect(clockText()).toBe("0.00");
    expect(endMemorizationPhase).toHaveBeenCalledTimes(1);
    expect(startSolutionPhase).toHaveBeenCalledTimes(1);
    expect(stopTimerSound).toHaveBeenCalledTimes(1);
    expect(playSound).toHaveBeenCalledWith("timerEnd");

    advanceBy(16);
    advanceBy(16);
    expect(endMemorizationPhase).toHaveBeenCalledTimes(1);
  });

  it("ends the phase once when a stalled tab wakes up past the deadline", () => {
    render(<ResponsiveMemorizationBoard />);

    advanceBy(45_000);

    expect(clockText()).toBe("0.00");
    expect(endMemorizationPhase).toHaveBeenCalledTimes(1);
  });

  it("charges a hidden tab no more memorizing than the round configured", () => {
    render(<ResponsiveMemorizationBoard />);

    advanceBy(120_000);

    expect(endMemorizationPhase).toHaveBeenCalledWith(5);
  });

  it("does not charge the frame's overshoot past the deadline", () => {
    render(<ResponsiveMemorizationBoard />);

    advanceBy(5_012);

    expect(endMemorizationPhase).toHaveBeenCalledWith(5);
  });

  it("reports the time actually spent memorizing when Skip cuts the phase short", () => {
    const { getByText } = render(<ResponsiveMemorizationBoard />);

    advanceBy(1_800);
    act(() => {
      getByText("Skip").click();
    });

    expect(endMemorizationPhase).toHaveBeenCalledWith(1.8);
    expect(startSolutionPhase).toHaveBeenCalledTimes(1);
    expect(playSound).toHaveBeenCalledWith("timerEnd");
    expect(stopTimerSound).not.toHaveBeenCalled();
  });

  it("stops the frame loop when the board unmounts mid-phase", () => {
    const { unmount } = render(<ResponsiveMemorizationBoard />);

    advanceBy(1_000);
    unmount();
    advanceBy(10_000);

    expect(endMemorizationPhase).not.toHaveBeenCalled();
    expect(pendingFrames.size).toBe(0);
  });
});
