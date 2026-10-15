// Global type definitions

interface Window {
  gtag: (
    command: 'event',
    eventName: string, // For example 'video_start' or 'video_complete'
    eventParams: {
      event_category?: string; // For example 'engagement'
      event_label?: string;    // For example 'YouTube Tutorial Video'
      event_action?: string;
      value?: number;
      [key: string]: string | number | boolean | undefined;
    }
  ) => void;
} 