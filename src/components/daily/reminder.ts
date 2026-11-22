import { DAY_MS } from "@/lib/lab/readiness";

export const REMINDER_URL = "https://thememorychess.com/daily";
export const REMINDER_FILENAME = "memory-chess-daily-board.ics";

const UID = "daily-board-reminder@thememorychess.com";
const MINUTE_MS = 60_000;
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

/**
 * A calendar file with one event that repeats daily at the minute the player asked. The next 00:00 UTC, when a new board
 * opens, is at most a day away, so the first event is exactly a day later, at the same clock time in any fixed offset.
 * Times are UTC, which every calendar reads the same way, so the clock time moves by an hour when daylight saving changes.
 */
export function reminderIcs(now: number, copy: ReminderCopy): string {
  const start = Math.floor((now + DAY_MS) / MINUTE_MS) * MINUTE_MS;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Memory Chess//Daily board//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${UID}`,
    `DTSTAMP:${stamp(now)}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(start + EVENT_MINUTES * MINUTE_MS)}`,
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
