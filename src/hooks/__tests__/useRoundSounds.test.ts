import { renderHook } from "@testing-library/react";
import { playSound, stopTimerSound } from "@/lib/utils/soundEffects";
import { useRoundSounds } from "@/hooks/useRoundSounds";
import type { RoundState } from "@/lib/round/round";

jest.mock("@/lib/utils/soundEffects", () => ({ playSound: jest.fn(), stopTimerSound: jest.fn() }));

const config = { pieceCount: 2, studyMs: 8000, source: "game_form" } as const;
const target = { e1: { color: "white", type: "king" } } as const;
const study = (startedAt: number): RoundState => ({ phase: "study", config, target, startedAt });
const rebuild = (startedAt: number): RoundState => ({
  phase: "rebuild",
  config,
  target,
  placed: {},
  selected: null,
  refused: null,
  studyMs: 3000,
  log: { startedAt, placements: [], removals: 0 },
});

describe("useRoundSounds", () => {
  let clock = 0;
  beforeEach(() => {
    jest.useFakeTimers();
    clock = 0;
    jest.spyOn(performance, "now").mockImplementation(() => clock);
    jest.mocked(playSound).mockClear();
    jest.mocked(stopTimerSound).mockClear();
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("plays the start sound and, half a second later, the timer cue when study begins", () => {
    renderHook(({ round }) => useRoundSounds(round), { initialProps: { round: study(0) } });
    expect(jest.mocked(playSound).mock.calls).toEqual([["success"]]);

    jest.advanceTimersByTime(500);

    expect(jest.mocked(playSound).mock.calls).toEqual([["success"], ["timer"]]);
  });

  it("plays the end cue when the board clears, and warns once placing has taken three quarters of the study time", () => {
    const { rerender } = renderHook(({ round }) => useRoundSounds(round), { initialProps: { round: study(0) } });
    jest.mocked(playSound).mockClear();

    rerender({ round: rebuild(0) });
    jest.advanceTimersByTime(5999);
    const beforeWarning = jest.mocked(playSound).mock.calls.slice();
    jest.advanceTimersByTime(1);

    expect(beforeWarning).toEqual([["timerEnd"]]);
    expect(jest.mocked(playSound).mock.calls).toEqual([["timerEnd"], ["timer"]]);
    expect(stopTimerSound).toHaveBeenCalled();
  });

  it("plays nothing for a round that is not being played", () => {
    renderHook(() => useRoundSounds({ phase: "idle" }));
    jest.advanceTimersByTime(10_000);

    expect(playSound).not.toHaveBeenCalled();
  });
});
