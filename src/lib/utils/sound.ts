type SoundEffect = 'click' | 'match' | 'reveal' | 'success' | 'error';

const soundEffects: Record<SoundEffect, string> = {
  click: '/sounds/click.mp3',
  match: '/sounds/match.mp3',
  reveal: '/sounds/reveal.mp3',
  success: '/sounds/success.mp3',
  error: '/sounds/error.mp3'
};

let isSoundEnabled = true;

export function toggleSound(enabled: boolean) {
  isSoundEnabled = enabled;
}

export function playSound(effect: SoundEffect) {
  if (!isSoundEnabled) return;

  const audio = new Audio(soundEffects[effect]);
  audio.volume = 0.5;
  audio.play().catch(() => {
    // Ignore errors (e.g., when user hasn't interacted with the page yet)
  });
} 