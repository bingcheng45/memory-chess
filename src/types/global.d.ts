// Global type definitions

interface Window {
  gtag: (
    command: 'event',
    eventName: string,
    eventParams: {
      event_category?: string;
      event_label?: string;
      event_action?: string;
      value?: number;
      [key: string]: string | number | boolean | undefined;
    }
  ) => void;
} 