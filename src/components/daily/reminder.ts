export const REMINDER_URL = "https://thememorychess.com/daily";
export const REMINDER_FILENAME = "memory-chess-daily-board.ics";

const UID = "daily-board-reminder@thememorychess.com";
const EVENT_MINUTES = 15;
const MAX_OCTETS = 75;

const utf8Octets = (char: string): number => {
  const code = char.codePointAt(0) ?? 0;
  return code < 0x80 ? 1 : code < 0x800 ? 2 : code < 0x10000 ? 3 : 4;
};

export interface ReminderCopy {
  readonly title: string;
  readonly description: string;
}

const stamp = (at: number): string => new Date(at).toISOString().replace(/[-:]|\.\d{3}/g, "");

const escapeText = (value: string): string => value.replace(/[;,\\]/g, "\\$&").replace(/\r?\n/g, "\\n");

/** RFC 5545 section 3.1: a physical line holds at most 75 octets, and each continuation starts with one space. */
function fold(line: string): string {
  const parts: string[] = [];
  let current = "";
  let octets = 0;
  for (const char of line) {
    const size = utf8Octets(char);
    if (octets + size > MAX_OCTETS) {
      parts.push(current);
      current = " ";
      octets = 1;
    }
    current += char;
    octets += size;
  }
  parts.push(current);
  return parts.join("\r\n");
}

const pad = (value: number): string => String(value).padStart(2, "0");

/** RFC 5545 section 3.3.5 floating time: no zone, so the calendar keeps the same wall-clock time through daylight saving changes. */
const floating = (at: number): string => {
  const date = new Date(at);
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
};

/** A calendar file with one event that repeats daily at the player's local clock time of `now`, the moment they pressed the button. */
export function reminderIcs(now: number, copy: ReminderCopy): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Memory Chess//Daily board//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${UID}`,
    `DTSTAMP:${stamp(now)}`,
    `DTSTART:${floating(now)}`,
    `DTEND:${floating(now + EVENT_MINUTES * 60_000)}`,
    "RRULE:FREQ=DAILY",
    `SUMMARY:${escapeText(copy.title)}`,
    `DESCRIPTION:${escapeText(copy.description)}`,
    `URL:${REMINDER_URL}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeText(copy.title)}`,
    "TRIGGER:PT0M",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return `${lines.map(fold).join("\r\n")}\r\n`;
}
