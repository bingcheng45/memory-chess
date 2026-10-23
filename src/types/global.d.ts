// Global type definitions

interface Window {
  gtag: ((
    command: 'set',
    target: 'user_properties',
    properties: Record<string, string>
  ) => void) & ((
    command: 'event',
    eventName: string, // For example 'video_start' or 'video_complete'
    eventParams: {
      event_category?: string; // For example 'engagement'
      event_label?: string;    // For example 'YouTube Tutorial Video'
      event_action?: string;
      value?: number;
      [key: string]: string | number | boolean | undefined;
    }
  ) => void);
} 