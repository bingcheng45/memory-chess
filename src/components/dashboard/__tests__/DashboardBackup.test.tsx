import { act, fireEvent } from "@testing-library/react";
import { renderWithIntl, screen } from "@/test-utils/intl";
import { DashboardBackup } from "@/components/dashboard/DashboardBackup";
import { persona } from "@/test-utils/labPersona";

const NOW = Date.UTC(2026, 9, 8, 12);
const DAY = 24 * 60 * 60 * 1000;

function storagePersisted(answer: boolean) {
  Object.defineProperty(navigator, "storage", { configurable: true, value: { persisted: () => Promise.resolve(answer) } });
}

async function show(record: ReturnType<typeof persona>) {
  const view = renderWithIntl(<DashboardBackup record={record} />);
  await act(async () => {});
  return view;
}

const cardText = () => document.querySelector('[data-note="backup"]')?.textContent ?? null;
const capText = () => document.querySelector('[data-note="cap"]')?.textContent ?? null;

beforeEach(() => {
  window.localStorage.clear();
  jest.useFakeTimers({ now: NOW, doNotFake: ["queueMicrotask", "nextTick", "setImmediate"] });
});
afterEach(() => jest.useRealTimers());

describe("the backup reminder", () => {
  it("asks a player with 90 rounds and no copy to download one, and confirms the download", async () => {
    storagePersisted(false);
    const record = persona("thirtyDays");
    await show(record);

    expect(cardText()).toBe(
      "Keep a copy of your recordYour 90 rounds live only in this browser, which may clear them to free up space. A downloaded copy keeps them safe.Download a copyNot now",
    );
    fireEvent.click(screen.getByRole("button", { name: "Download a copy" }));
    expect(record.download).toHaveBeenCalledTimes(1);
    expect(cardText()).toBe("Keep a copy of your recordDownload started. Keep the file somewhere other than this browser.");
  });

  it("says how many rounds and days the last copy misses", async () => {
    storagePersisted(false);
    const record = { ...persona("thirtyDays"), lastBackup: NOW - 20 * DAY };
    await show(record);

    expect(document.querySelector('[data-note="backup"] p')?.textContent).toBe(
      "62 rounds have been played since your last copy on Sep 18, 2026. This browser may clear its stored data to free up space, so download a fresh copy.",
    );
  });

  it("stays away while the browser keeps the record for good", async () => {
    storagePersisted(true);
    await show(persona("thirtyDays"));

    expect(cardText()).toBeNull();
  });

  it("hides for 14 days after Not now", async () => {
    storagePersisted(false);
    const { unmount } = await show(persona("thirtyDays"));

    fireEvent.click(screen.getByRole("button", { name: "Not now" }));
    expect(cardText()).toBeNull();
    expect(window.localStorage.getItem("memory-chess-lab-backup-snooze")).toBe(String(NOW + 14 * DAY));
    unmount();

    await show(persona("thirtyDays"));
    expect(cardText()).toBeNull();
  });
});

describe("the round cap notice", () => {
  it("tells a player once that the record has started replacing its oldest rounds", async () => {
    storagePersisted(true);
    const capped = (() => {
      const record = persona("thirtyDays");
      return { ...record, summary: { ...record.summary, evictedThrough: NOW - 30 * DAY } };
    })();
    const { unmount } = await show(capped);

    expect(capText()).toBe(
      "Your record is fullYour record keeps your newest 5,000 rounds one by one, so each new round now replaces your oldest. Your totals, streaks and bests still count every round.Got it",
    );
    fireEvent.click(screen.getByRole("button", { name: "Got it" }));
    expect(capText()).toBeNull();
    unmount();

    await show(capped);
    expect(capText()).toBeNull();
    await show(persona("thirtyDays"));
    expect(capText()).toBeNull();
  });
});
