import { act, fireEvent, render, screen } from "@/test-utils/intl";
import { RemindMe } from "@/components/daily/RemindMe";
import TomorrowBoardCard from "@/components/game/TomorrowBoardCard";

jest.mock("@/i18n/navigation", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

let blobs: Blob[] = [];
let downloads: { name: string; href: string }[] = [];

beforeEach(() => {
  blobs = [];
  downloads = [];
  window.URL.createObjectURL = jest.fn((blob: Blob) => {
    blobs.push(blob);
    return `blob:reminder-${blobs.length}`;
  });
  window.URL.revokeObjectURL = jest.fn();
  jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
    downloads.push({ name: this.download, href: this.href });
  });
  window.gtag = jest.fn();
  jest.useFakeTimers({ now: Date.parse("2026-10-27T13:45:10Z") });
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
  // @ts-expect-error gtag is optional at runtime
  delete window.gtag;
});

const textOf = (blob: Blob) =>
  new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.readAsText(blob);
  });

describe("RemindMe", () => {
  it.each(["result", "dashboard", "daily"] as const)("downloads the daily calendar file and reports a reminder from the %s surface", async (surface) => {
    render(<RemindMe surface={surface} />);

    fireEvent.click(screen.getByRole("button", { name: "Remind me daily" }));

    expect(downloads).toEqual([{ name: "memory-chess-daily-board.ics", href: "blob:reminder-1" }]);
    expect(blobs[0].type).toBe("text/calendar;charset=utf-8");
    const ics = await textOf(blobs[0]);
    expect(ics).toContain("\r\nDTSTART:20261028T000000Z\r\n");
    expect(ics).toContain("\r\nRRULE:FREQ=DAILY\r\n");
    expect(ics).toContain("\r\nSUMMARY:Memory Chess daily board\r\n");
    expect(ics).toContain("\r\nURL:https://thememorychess.com/daily\r\n");
    expect(window.gtag).toHaveBeenCalledTimes(1);
    expect(window.gtag).toHaveBeenCalledWith("event", "reminder_set", { surface });
    expect(screen.getByText("Saved. Open the file to add the daily event to your calendar.")).toBeInTheDocument();
    act(() => jest.advanceTimersByTime(10_000));
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith("blob:reminder-1");
  });

  it("says the board opens at midnight UTC and carries no local clock time that a daylight saving change would make stale", async () => {
    render(<RemindMe surface="daily" />);

    fireEvent.click(screen.getByRole("button", { name: "Remind me daily" }));

    const ics = (await textOf(blobs[0])).replace(/\r\n /g, "");
    expect(ics).toContain("DESCRIPTION:A new board opens every day at midnight UTC. Everyone plays the same board\\, and you get one try.");
    expect(ics).not.toMatch(/\d:\d\d/);
  });

  it("sits beside tomorrow's board on the result screen", () => {
    render(<TomorrowBoardCard />);

    expect(screen.getByRole("region", { name: "Tomorrow's board" })).toContainElement(screen.getByRole("button", { name: "Remind me daily" }));
  });
});
