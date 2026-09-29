import { renderHook } from "@testing-library/react";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { GamePhase } from "@/lib/types/game";
import { isSoundEnabled } from "@/lib/utils/soundEffects";

let mockGamePhase = GamePhase.SOLUTION;

jest.mock("@/lib/store/gameStore", () => ({
  useGameStore: () => ({ gameState: { success: true }, gamePhase: mockGamePhase }),
}));

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

  expect(window.gtag).toHaveBeenCalledTimes(1);
  expect(window.gtag).toHaveBeenCalledWith("event", "sound_settings", {
    event_category: "user_preferences",
    event_label: label,
    value,
  });
});
