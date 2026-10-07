import { renderHook } from "@testing-library/react";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { GamePhase } from "@/lib/types/game";
import { isSoundEnabled } from "@/lib/utils/soundEffects";

let mockGamePhase = GamePhase.SOLUTION;

jest.mock("@/lib/store/gameStore", () => {
  const mockState = () => ({
    gameState: {
      success: true,
      pieceCount: 6,
      memorizeTime: 10,
      correctPlacements: 4,
      accuracy: 67,
      startSource: "try_again",
    },
    gamePhase: mockGamePhase,
  });
  const useGameStore = () => mockState();
  useGameStore.getState = mockState;
  return { useGameStore };
});

jest.mock("@/lib/utils/soundEffects", () => ({
  playSound: jest.fn(),
  isSoundEnabled: jest.fn(),
}));

beforeEach(() => {
  mockGamePhase = GamePhase.SOLUTION;
  window.gtag = jest.fn();
  jest.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

it.each([
  [true, "sound_on", 1],
  [false, "sound_off", 0],
])("sends one sound_settings event to gtag when a round reaches its result (sound enabled: %s)", (enabled, label, value) => {
  jest.mocked(isSoundEnabled).mockReturnValue(enabled);
  const { rerender } = renderHook(() => useSoundEffects());

  mockGamePhase = GamePhase.RESULT;
  rerender();
  rerender();

  expect(window.gtag).toHaveBeenCalledTimes(2);
  expect(window.gtag).toHaveBeenNthCalledWith(1, "event", "sound_settings", {
    event_category: "user_preferences",
    event_label: label,
    value,
  });
});

it("sends one round_complete event with the real result when a round reaches its result", () => {
  jest.mocked(isSoundEnabled).mockReturnValue(true);
  const { rerender } = renderHook(() => useSoundEffects());

  mockGamePhase = GamePhase.RESULT;
  rerender();
  rerender();

  expect(window.gtag).toHaveBeenCalledTimes(2);
  expect(window.gtag).toHaveBeenCalledWith("event", "round_complete", {
    piece_count: 6,
    memorize_time: 10,
    correct_pieces: 4,
    accuracy: 67,
    source: "try_again",
  });
});
