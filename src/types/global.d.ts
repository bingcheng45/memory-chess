// Global type definitions

interface Window {
  gtag: (
    command: 'event',
    eventName: string, // Can be 'video_interaction', 'sound_settings', etc.
    eventParams: {
      event_category?: string; // Can be 'engagement', 'user_preferences', etc.
      event_label?: string;    // Can be 'YouTube Tutorial Video', 'sound_on', 'sound_off', etc.
      event_action?: string;
      value?: number;
      [key: string]: string | number | boolean | undefined;
    }
  ) => void;
} 