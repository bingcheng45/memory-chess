import { reminderIcs, REMINDER_URL } from "@/components/daily/reminder";

const copy = { title: "Memory Chess daily board", description: "A new board opens every day at 08:00 your time." };

function unfold(ics: string): string[] {
  return ics.replace(/\r\n[ \t]/g, "").split("\r\n");
}

describe("reminderIcs", () => {
  const ics = reminderIcs(Date.parse("2026-10-27T13:45:10Z"), copy);
  const lines = unfold(ics);

  it("is a CRLF calendar with one event that ends with a final CRLF", () => {
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics.replace(/\r\n/g, "")).not.toMatch(/[\r\n]/);
    expect(lines.filter((line) => line === "BEGIN:VEVENT")).toHaveLength(1);
    expect(lines.filter((line) => line === "END:VEVENT")).toHaveLength(1);
  });

  it("starts at the local click time as a floating time and repeats daily", () => {
    const local = unfold(reminderIcs(new Date(2026, 9, 27, 13, 45, 10).getTime(), copy));

    expect(local).toContain("DTSTART:20261027T134510");
    expect(local).toContain("DTEND:20261027T140010");
    expect(local).toContain("RRULE:FREQ=DAILY");
  });

  it("keeps a click just after local midnight on that calendar day", () => {
    expect(unfold(reminderIcs(new Date(2026, 9, 28, 0, 5, 0).getTime(), copy))).toContain("DTSTART:20261028T000500");
  });

  it("carries a stable UID, the moment it was made, the title and the daily page", () => {
    expect(lines).toContain("UID:daily-board-reminder@thememorychess.com");
    expect(lines).toContain("DTSTAMP:20261027T134510Z");
    expect(lines).toContain("SUMMARY:Memory Chess daily board");
    expect(lines).toContain("URL:https://thememorychess.com/daily");
    expect(REMINDER_URL).toBe("https://thememorychess.com/daily");
  });

  it("alarms when the event starts", () => {
    expect(lines).toEqual(expect.arrayContaining(["BEGIN:VALARM", "ACTION:DISPLAY", "TRIGGER:PT0M", "END:VALARM"]));
  });

  it("escapes text values and folds lines longer than 75 octets on character boundaries", () => {
    const long = reminderIcs(0, { title: "Tableau du jour; echecs, \\ memoire", description: `${"é".repeat(60)}\nsecond line` });
    const unfolded = unfold(long);

    expect(unfolded).toContain("SUMMARY:Tableau du jour\\; echecs\\, \\\\ memoire");
    expect(unfolded).toContain(`DESCRIPTION:${"é".repeat(60)}\\nsecond line`);
    for (const physical of long.split("\r\n")) expect(Buffer.byteLength(physical, "utf8")).toBeLessThanOrEqual(75);
    expect(long).not.toContain("�");
  });

  it.each([
    ["CJK", "新棋局每天在 UTC 午夜开放。".repeat(8)],
    ["Devanagari", "नया बोर्ड हर दिन मध्यरात्रि को खुलता है। ".repeat(5)],
  ])("folds %s text within 75 octets without splitting a character", (_script, text) => {
    const folded = reminderIcs(0, { title: "t", description: text });

    for (const physical of folded.split("\r\n")) expect(Buffer.byteLength(physical, "utf8")).toBeLessThanOrEqual(75);
    expect(unfold(folded)).toContain(`DESCRIPTION:${text}`);
  });

  it("holds no personal data, only the fixed fields", () => {
    const names = lines.filter((line) => line !== "").map((line) => line.split(/[:;]/)[0]);
    expect(names).not.toEqual(expect.arrayContaining(["ATTENDEE", "ORGANIZER", "LOCATION", "GEO"]));
  });
});
