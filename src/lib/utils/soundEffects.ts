'use client';

// Sound effect URLs (using free sounds from Pixabay and other free sources)
const SOUND_URLS = {
  success: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_c738d2fb1d.mp3?filename=success-1-6297.mp3',
  failure: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_db1b9053f1.mp3?filename=failure-drum-sound-effect-2-7184.mp3',
  click: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_2cdc5d9ac7.mp3?filename=click-button-140881.mp3',
  timer: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_12b0c7443c.mp3?filename=clock-ticking-60-second-countdown-68610.mp3',
  timerEnd: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_c8c0c57083.mp3?filename=ding-126626.mp3',
  place: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8e0d57d1c.mp3?filename=click-21156.mp3',
  remove: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_d482fbec1f.mp3?filename=pop-39222.mp3',
};

// Cache for audio objects
const audioCache: Record<string, HTMLAudioElement> = {};

// Sound settings
let soundEnabled = true;
let volume = 0.5;

/**
 * Initialize a sound by preloading it
 * @param soundName The name of the sound to initialize
 */
export const initSound = (soundName: keyof typeof SOUND_URLS): void => {
  if (typeof window === 'undefined') return;
  
  if (!audioCache[soundName]) {
    const audio = new Audio(SOUND_URLS[soundName]);
    audio.volume = volume;
    audioCache[soundName] = audio;
  }
};

/**
 * Preload all sounds
 */
export const preloadAllSounds = (): void => {
  if (typeof window === 'undefined') return;
  
  Object.keys(SOUND_URLS).forEach((key) => {
    initSound(key as keyof typeof SOUND_URLS);
  });
};

/**
 * Play a sound effect
 * @param soundName The name of the sound to play
 */
export const playSound = (soundName: keyof typeof SOUND_URLS): void => {
  if (typeof window === 'undefined' || !soundEnabled) return;
  
  // Initialize sound if not already cached
  if (!audioCache[soundName]) {
    initSound(soundName);
  }
  
  // Clone the audio to allow overlapping sounds
  const sound = audioCache[soundName].cloneNode() as HTMLAudioElement;
  sound.volume = volume;
  sound.play().catch(err => {
    console.error(`Error playing sound ${soundName}:`, err);
  });
};

/**
 * Enable or disable sounds
 * @param enabled Whether sounds should be enabled
 */
export const setSoundEnabled = (enabled: boolean): void => {
  soundEnabled = enabled;
};

/**
 * Check if sound is enabled
 * @returns Whether sound is enabled
 */
export const isSoundEnabled = (): boolean => {
  return soundEnabled;
};

/**
 * Set the volume for all sounds
 * @param newVolume Volume level (0.0 to 1.0)
 */
export const setVolume = (newVolume: number): void => {
  volume = Math.max(0, Math.min(1, newVolume));
  
  // Update volume for cached audio objects
  Object.values(audioCache).forEach(audio => {
    audio.volume = volume;
  });
};

/**
 * Get the current volume
 * @returns Current volume level
 */
export const getVolume = (): number => {
  return volume;
};

// Initialize sounds when this module is imported on the client side
if (typeof window !== 'undefined') {
  // Delay preloading to not block initial page load
  setTimeout(() => {
    preloadAllSounds();
  }, 1000);
} 