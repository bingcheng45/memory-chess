'use client';

// Sound settings
let soundEnabled = true;
let volume = 1.0;

// Sound URLs from local public folder
const SOUND_URLS = {
  click: '/sounds/click.mp3',
  success: '/sounds/success.mp3',
  failure: '/sounds/failure.mp3',
  timer: '/sounds/timer.mp3',
  timerEnd: '/sounds/timer-end.mp3',
  place: '/sounds/place.mp3',
  remove: '/sounds/remove.mp3'
};

// Cache for audio objects
const audioCache: Record<string, HTMLAudioElement | null> = {};

// Flag to track if user has interacted with the page
let userHasInteracted = false;

/**
 * Initialize a sound by preloading it
 */
const initSound = (soundName: keyof typeof SOUND_URLS): void => {
  if (typeof window === 'undefined') return;
  
  if (!audioCache[soundName]) {
    try {
      console.log(`Initializing sound: ${soundName}`);
      const audio = new Audio(SOUND_URLS[soundName]);
      audio.volume = volume;
      
      // Add error handler
      audio.addEventListener('error', (e) => {
        console.error(`Error loading sound ${soundName}:`, e);
        audioCache[soundName] = null;
      });
      
      // Preload the audio
      audio.load();
      
      audioCache[soundName] = audio;
    } catch (err) {
      console.error(`Error creating audio for ${soundName}:`, err);
      audioCache[soundName] = null;
    }
  }
};

/**
 * Preload all sounds
 */
const preloadAllSounds = (): void => {
  if (typeof window === 'undefined') return;
  
  console.log('Preloading all sounds');
  Object.keys(SOUND_URLS).forEach((key) => {
    initSound(key as keyof typeof SOUND_URLS);
  });
};

/**
 * Play a sound effect
 */
export const playSound = (soundName: keyof typeof SOUND_URLS): void => {
  if (typeof window === 'undefined' || !soundEnabled) {
    console.log('Sound disabled or not in browser');
    return;
  }
  
  console.log(`Attempting to play sound: ${soundName}`);
  
  // Initialize sound if not already cached
  if (audioCache[soundName] === undefined) {
    initSound(soundName);
  }
  
  // Skip if sound failed to load
  if (audioCache[soundName] === null) {
    console.warn(`Sound ${soundName} failed to load, cannot play`);
    return;
  }
  
  try {
    // If user hasn't interacted yet, we need to wait for interaction
    if (!userHasInteracted) {
      console.log('User has not interacted yet, queueing sound to play on next interaction');
      
      const playOnNextInteraction = () => {
        console.log(`Playing queued sound ${soundName} after user interaction`);
        userHasInteracted = true;
        playSound(soundName);
        
        // Remove the event listeners
        window.removeEventListener('click', playOnNextInteraction);
        window.removeEventListener('keydown', playOnNextInteraction);
        window.removeEventListener('touchstart', playOnNextInteraction);
      };
      
      window.addEventListener('click', playOnNextInteraction, { once: true });
      window.addEventListener('keydown', playOnNextInteraction, { once: true });
      window.addEventListener('touchstart', playOnNextInteraction, { once: true });
      
      return;
    }
    
    // Create a new audio element for each play to allow overlapping sounds
    const sound = new Audio(SOUND_URLS[soundName]);
    sound.volume = volume;
    
    // Play with error handling
    const playPromise = sound.play();
    if (playPromise !== undefined) {
      playPromise.catch(err => {
        console.error(`Error playing sound ${soundName}:`, err);
        
        // Try playing on user interaction as fallback
        const playOnInteraction = () => {
          sound.play().catch(e => console.error('Still failed to play sound:', e));
          document.removeEventListener('click', playOnInteraction);
        };
        document.addEventListener('click', playOnInteraction, { once: true });
      });
    }
  } catch (err) {
    console.error(`Error with sound ${soundName}:`, err);
  }
};

/**
 * Enable or disable sounds
 */
export const setSoundEnabled = (enabled: boolean): void => {
  soundEnabled = enabled;
  console.log(`Sound ${enabled ? 'enabled' : 'disabled'}`);
};

/**
 * Check if sound is enabled
 */
export const isSoundEnabled = (): boolean => {
  return soundEnabled;
};

/**
 * Set the volume for all sounds
 */
export const setVolume = (newVolume: number): void => {
  volume = Math.max(0, Math.min(1, newVolume));
  console.log(`Sound volume set to ${volume}`);
  
  // Update volume for cached audio objects
  Object.values(audioCache).forEach(audio => {
    if (audio) audio.volume = volume;
  });
};

/**
 * Get the current volume
 */
export const getVolume = (): number => {
  return volume;
};

/**
 * Check if sound files are valid and log their status
 */
export const checkSoundFiles = async (): Promise<void> => {
  if (typeof window === 'undefined') return;
  
  console.log('Checking sound files...');
  
  for (const [name, url] of Object.entries(SOUND_URLS)) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`Sound file ${name} (${url}) not found: ${response.status} ${response.statusText}`);
        continue;
      }
      
      const contentType = response.headers.get('content-type');
      const contentLength = response.headers.get('content-length');
      
      console.log(`Sound file ${name}: ${url}`);
      console.log(`  Content-Type: ${contentType}`);
      console.log(`  Size: ${contentLength} bytes`);
      
      if (!contentType?.includes('audio')) {
        console.warn(`  Warning: ${name} may not be a valid audio file (Content-Type: ${contentType})`);
      }
      
      if (contentLength && parseInt(contentLength) < 1000) {
        console.warn(`  Warning: ${name} is very small (${contentLength} bytes), might be corrupted`);
      }
    } catch (err) {
      console.error(`Error checking sound file ${name} (${url}):`, err);
    }
  }
};

// Preload sounds when this module is imported on the client side
if (typeof window !== 'undefined') {
  // Delay preloading to not block initial page load
  setTimeout(() => {
    preloadAllSounds();
    checkSoundFiles(); // Check sound files after preloading
  }, 1000);
  
  // Mark user as interacted when they interact with the page
  const initSoundOnInteraction = () => {
    console.log('User interaction detected, initializing sounds');
    userHasInteracted = true;
    preloadAllSounds();
    
    // Remove event listeners after first interaction
    window.removeEventListener('click', initSoundOnInteraction);
    window.removeEventListener('keydown', initSoundOnInteraction);
    window.removeEventListener('touchstart', initSoundOnInteraction);
  };
  
  window.addEventListener('click', initSoundOnInteraction);
  window.addEventListener('keydown', initSoundOnInteraction);
  window.addEventListener('touchstart', initSoundOnInteraction);
} 