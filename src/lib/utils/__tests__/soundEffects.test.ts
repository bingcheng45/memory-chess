import {
  DEFAULT_SOUND_VOLUME,
  getVolume,
  setVolume,
} from "@/lib/utils/soundEffects";

describe("sound effects volume", () => {
  afterEach(() => {
    setVolume(DEFAULT_SOUND_VOLUME);
  });

  it("starts at the quieter 50% default", () => {
    expect(DEFAULT_SOUND_VOLUME).toBe(0.5);
    expect(getVolume()).toBe(DEFAULT_SOUND_VOLUME);
  });

  it("preserves the full 0–100% control range", () => {
    setVolume(0);
    expect(getVolume()).toBe(0);

    setVolume(1);
    expect(getVolume()).toBe(1);
  });
});
