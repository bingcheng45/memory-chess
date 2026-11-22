import { reminderIcs, REMINDER_URL } from "@/components/daily/reminder";

const copy = { title: "Memory Chess daily board", description: "A new board opens every day at 08:00 your time." };

function unfold(ics: string): string[] {
  return ics.replace(/\r\n[ \t]/g, "").split("\r\n");
}

const valueOf = (lines: string[], name: string): string => (lines.find((line) => line.startsWith(`${name}:`)) ?? "").slice(name.length + 1);

/** The moment a floating time means on a clock at this offset. */
const instantOf = (floating: string, utcOffsetMinutes: number): string => {
  const iso = floating.replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/, "$1-$2-$3T$4:$5:$6Z");
  return new Date(Date.parse(iso) - utcOffsetMinutes * 60_000).toISOString();
};

describe("reminderIcs", () => {
  const ics = reminderIcs(Date.parse("2026-10-27T13:45:10Z"), 60, copy);
  const lines = unfold(ics);

  it("is a CRLF calendar with one event that ends with a final CRLF", () => {
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics.replace(/\r\n/g, "")).not.toMatch(/[\r\n]/);
    expect(lines.filter((line) => line === "BEGIN:VEVENT")).toHaveLength(1);
    expect(lines.filter((line) => line === "END:VEVENT")).toHaveLength(1);
  });

  it("starts tomorrow at the clock time of the click, in floating time, and repeats daily", () => {
    expect(lines).toContain("DTSTART:20261028T144510");
    expect(lines).toContain("DTEND:20261028T150010");
    expect(lines).toContain("RRULE:FREQ=DAILY");
  });

  it.each([
    ["UTC+1, Berlin in winter", 60, "2026-10-27T13:45:10Z", "20261028T144510", "2026-10-28T13:45:10.000Z", "2026-10-28T00:00:00.000Z"],
    ["UTC-5, New York in winter, the evening before the UTC date", -300, "2026-10-28T02:30:00Z", "20261028T213000", "2026-10-29T02:30:00.000Z", "2026-10-29T00:00:00.000Z"],
    ["UTC+8, Singapore, the morning after the UTC date", 480, "2026-10-27T23:30:00Z", "20261029T073000", "2026-10-28T23:30:00.000Z", "2026-10-28T00:00:00.000Z"],
    ["UTC+8, clicked the moment a board opens", 480, "2026-10-28T00:00:00Z", "20261029T080000", "2026-10-29T00:00:00.000Z", "2026-10-29T00:00:00.000Z"],
  ])("in %s, starts at the click's local time and never before the next board opens", (_zone, offset, clickedAt, localStart, startsAt, nextBoardAt) => {
    const start = valueOf(unfold(reminderIcs(Date.parse(clickedAt), offset, copy)), "DTSTART");

    expect(start).toBe(localStart);
    expect(instantOf(start, offset)).toBe(startsAt);
    expect(instantOf(start, offset) >= nextBoardAt).toBe(true);
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
    const long = reminderIcs(0, 0, { title: "Tableau du jour; echecs, \\ memoire", description: `${"é".repeat(60)}\nsecond line` });
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
    const folded = reminderIcs(0, 0, { title: "t", description: text });

    for (const physical of folded.split("\r\n")) expect(Buffer.byteLength(physical, "utf8")).toBeLessThanOrEqual(75);
    expect(unfold(folded)).toContain(`DESCRIPTION:${text}`);
  });

  it("holds no personal data, only the fixed fields", () => {
    const names = lines.filter((line) => line !== "").map((line) => line.split(/[:;]/)[0]);
    expect(names).not.toEqual(expect.arrayContaining(["ATTENDEE", "ORGANIZER", "LOCATION", "GEO"]));
  });
});
