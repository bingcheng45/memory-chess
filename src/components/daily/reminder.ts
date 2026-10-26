import { msToNextUtcDay } from "@/lib/lab/daily";

export const REMINDER_URL = "https://thememorychess.com/daily";
export const REMINDER_FILENAME = "memory-chess-daily-board.ics";

const UID = "daily-board-reminder@thememorychess.com";
const EVENT_MINUTES = 15;
const MAX_OCTETS = 75;

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
    const size = Buffer.byteLength(char, "utf8");
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

/** A calendar file with one event that repeats daily from the next 00:00 UTC, when the day's board opens. */
export function reminderIcs(now: number, copy: ReminderCopy): string {
  const start = now + msToNextUtcDay(now);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Memory Chess//Daily board//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${UID}`,
    `DTSTAMP:${stamp(now)}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(start + EVENT_MINUTES * 60_000)}`,
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
