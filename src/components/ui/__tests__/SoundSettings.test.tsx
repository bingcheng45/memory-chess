import { fireEvent, render, screen, waitFor } from "@/test-utils/intl";
import SoundSettings from "@/components/ui/SoundSettings";
import { DEFAULT_SOUND_VOLUME, setVolume } from "@/lib/utils/soundEffects";

jest.mock("@/lib/utils/soundEffects", () => ({
  DEFAULT_SOUND_VOLUME: 0.1,
  isSoundEnabled: jest.fn(() => true),
  getVolume: jest.fn(() => 0.1),
  setSoundEnabled: jest.fn(),
  setVolume: jest.fn(),
  playSound: jest.fn(),
}));

describe("SoundSettings", () => {
  beforeEach(() => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 390,
      writable: true,
    });
    jest.mocked(setVolume).mockClear();
  });

  it("restores the 10% default when mobile sound is enabled", async () => {
    render(<SoundSettings />);

    await waitFor(() => {
      expect(setVolume).toHaveBeenCalledWith(DEFAULT_SOUND_VOLUME);
    });

    fireEvent.click(screen.getByRole("button", { name: "Mute sound" }));
    fireEvent.click(screen.getByRole("button", { name: "Unmute sound" }));

    expect(setVolume).toHaveBeenLastCalledWith(DEFAULT_SOUND_VOLUME);
  });
});
