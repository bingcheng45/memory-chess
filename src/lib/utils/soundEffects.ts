"use client";

export const DEFAULT_SOUND_VOLUME = 0.1;

let soundEnabled = true;
let volume = DEFAULT_SOUND_VOLUME;

const SOUND_URLS = {
  click: "/sounds/click.mp3",
  success: "/sounds/success.mp3",
  failure: "/sounds/failure.mp3",
  timer: "/sounds/timer.mp3",
  timerEnd: "/sounds/timer-end.mp3",
  place: "/sounds/place.mp3",
  remove: "/sounds/remove.mp3",
  reveal: "/sounds/click.mp3",
  match: "/sounds/success.mp3",
  error: "/sounds/failure.mp3",
};

type SoundName = keyof typeof SOUND_URLS;

/** The sounds a round and its result screen play after the Start round click. */
const ROUND_SOUNDS: readonly SoundName[] = ["success", "timer", "timerEnd", "failure"];

const audioByUrl = new Map<string, HTMLAudioElement>();
let currentTimerAudio: HTMLAudioElement | null = null;

const audioFor = (soundName: SoundName): HTMLAudioElement => {
  const url = SOUND_URLS[soundName];
  const cached = audioByUrl.get(url);
  if (cached) return cached;

  const audio = new Audio(url);
  audio.volume = volume;
  audio.addEventListener("error", () => {
    const error = audio.error;
    console.error(`Error loading sound ${soundName}:`, error ? `${error.code} - ${error.message}` : "Unknown error");
    audioByUrl.delete(url);
  });
  audioByUrl.set(url, audio);
  return audio;
};

// Browsers without the User Activation API fall through to play(), whose rejection retries on the next click.
const hasUserActivation = (): boolean => navigator.userActivation?.hasBeenActive ?? true;

const playOnNextInteraction = (soundName: SoundName): void => {
  const play = () => {
    window.removeEventListener("click", play);
    window.removeEventListener("keydown", play);
    window.removeEventListener("touchstart", play);
    playSound(soundName);
  };
  window.addEventListener("click", play, { once: true });
  window.addEventListener("keydown", play, { once: true });
  window.addEventListener("touchstart", play, { once: true });
};

/**
 * Play a sound effect. Its file downloads on the first play, and later plays reuse that element.
 */
export const playSound = (soundName: SoundName): void => {
  if (typeof window === "undefined" || !soundEnabled) return;

  if (!hasUserActivation()) {
    playOnNextInteraction(soundName);
    return;
  }

  if (soundName === "timer") stopTimerSound();

  const cached = audioFor(soundName);
  // A clone lets a sound overlap its own earlier play, as when two clicks land close together.
  const sound = cached.paused ? cached : (cached.cloneNode() as HTMLAudioElement);
  sound.volume = volume;
  sound.currentTime = 0;
  if (soundName === "timer") currentTimerAudio = sound;

  sound.play()?.catch((err) => {
    console.error(`Error playing sound ${soundName}:`, err);
    const playOnInteraction = () => {
      sound.play().catch((e) => console.error("Still failed to play sound:", e));
    };
    document.addEventListener("click", playOnInteraction, { once: true });
  });
};

/**
 * Start downloading the sounds a round plays, so the first of them is not late.
 */
export const warmRoundSounds = (): void => {
  if (typeof window === "undefined" || !soundEnabled) return;
  for (const soundName of ROUND_SOUNDS) {
    const audio = audioFor(soundName);
    audio.preload = "auto";
    audio.load();
  }
};

/**
 * Stop the currently playing timer sound, if any.
 */
export const stopTimerSound = (): void => {
  if (!currentTimerAudio) return;
  currentTimerAudio.pause();
  currentTimerAudio.currentTime = 0;
  currentTimerAudio = null;
};

/**
 * Enable or disable sounds
 */
export const setSoundEnabled = (enabled: boolean): void => {
  soundEnabled = enabled;
};

/**
 * Check if sound is enabled
 */
export const isSoundEnabled = (): boolean => soundEnabled;

/**
 * Set the volume for all sounds
 */
export const setVolume = (newVolume: number): void => {
  volume = Math.max(0, Math.min(1, newVolume));
  audioByUrl.forEach((audio) => {
    audio.volume = volume;
  });
};

/**
 * Get the current volume
 */
export const getVolume = (): number => volume;
