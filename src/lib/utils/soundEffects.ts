"use client";

export const DEFAULT_SOUND_VOLUME = 0.05;

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

// iOS ignores an audio element's volume and plays it at full loudness, so every sound goes through one gain node.
let output: { context: AudioContext; gain: GainNode } | null = null;
const bufferByUrl = new Map<string, Promise<AudioBuffer | null>>();
let currentTimer: AudioBufferSourceNode | null = null;
// Bumped on every timer play and stop, so a timer still downloading never starts after it was stopped or replaced.
let timerPlay = 0;

const outputFor = (): { context: AudioContext; gain: GainNode } | null => {
  if (output) return output;
  if (typeof AudioContext === "undefined") return null;
  const context = new AudioContext();
  const gain = context.createGain();
  gain.gain.value = volume;
  gain.connect(context.destination);
  output = { context, gain };
  return output;
};

const IDLE_FALLBACK_MS = 200;
const UNLOCK_EVENTS = ["click", "touchend", "keydown"] as const;
let preparing = false;

const unlockOnFirstTap = (): void => {
  const unlock = () => {
    for (const type of UNLOCK_EVENTS) window.removeEventListener(type, unlock, true);
    output?.context.resume().catch((err: unknown) => console.error("Error resuming sound:", err));
  };
  for (const type of UNLOCK_EVENTS) window.addEventListener(type, unlock, true);
};

/**
 * Create the audio context and gain node while the browser is idle, so the first tap does not pay for them.
 * A context made without a gesture starts suspended; the first tap, or the first play, resumes it.
 */
export const prepareSound = (): void => {
  if (typeof window === "undefined" || !soundEnabled || preparing || output) return;
  preparing = true;
  const create = () => {
    preparing = false;
    if (!soundEnabled || !outputFor()) return;
    unlockOnFirstTap();
  };
  if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(create);
  else setTimeout(create, IDLE_FALLBACK_MS);
};

const bufferFor = (context: AudioContext, soundName: SoundName): Promise<AudioBuffer | null> => {
  const url = SOUND_URLS[soundName];
  const cached = bufferByUrl.get(url);
  if (cached) return cached;

  const loading = fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.arrayBuffer();
    })
    .then((data) => context.decodeAudioData(data))
    .catch((error: unknown) => {
      console.error(`Error loading sound ${soundName}:`, error);
      bufferByUrl.delete(url);
      return null;
    });
  bufferByUrl.set(url, loading);
  return loading;
};

// Browsers without the User Activation API fall through to resume(); a context it cannot start yet holds the sound until it can.
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
 * Play a sound effect. Its file downloads and decodes on the first play, and later plays reuse it.
 */
export const playSound = (soundName: SoundName): void => {
  if (typeof window === "undefined" || !soundEnabled) return;

  if (!hasUserActivation()) {
    playOnNextInteraction(soundName);
    return;
  }

  const out = outputFor();
  if (!out) return;
  if (soundName === "timer") stopTimerSound();
  const play = soundName === "timer" ? ++timerPlay : null;

  out.context.resume().catch((err: unknown) => console.error("Error resuming sound:", err));
  void bufferFor(out.context, soundName).then((buffer) => {
    if (!buffer || !soundEnabled || (play !== null && play !== timerPlay)) return;
    // A new source per play lets a sound overlap its own earlier play, as when two clicks land close together.
    const source = out.context.createBufferSource();
    source.buffer = buffer;
    source.connect(out.gain);
    source.start();
    if (play !== null) currentTimer = source;
  });
};

/**
 * Start downloading the sounds a round plays, so the first of them is not late.
 */
export const warmRoundSounds = (): void => {
  if (typeof window === "undefined" || !soundEnabled) return;
  const out = outputFor();
  if (!out) return;
  out.context.resume().catch((err: unknown) => console.error("Error resuming sound:", err));
  for (const soundName of ROUND_SOUNDS) void bufferFor(out.context, soundName);
};

/**
 * Stop the currently playing timer sound, if any.
 */
export const stopTimerSound = (): void => {
  timerPlay += 1;
  currentTimer?.stop();
  currentTimer = null;
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
  if (output) output.gain.gain.value = volume;
};

/**
 * Get the current volume
 */
export const getVolume = (): number => volume;
