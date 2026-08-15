import { act, fireEvent, render, screen } from "@testing-library/react";
import ChangelogBanner from "@/components/ui/ChangelogBanner";
import {
  CHANGELOG_DISMISSAL_STORAGE_KEY,
  LATEST_CHANGELOG_ENTRY,
} from "@/lib/changelog";

describe("ChangelogBanner", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-08-20T00:00:00.000Z"));
    window.localStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it("links to the latest changelog during its announcement window", async () => {
    render(<ChangelogBanner />);

    const link = await screen.findByRole("link", {
      name: /Memory Chess v1\.2\.0 is here/i,
    });

    expect(link).toHaveAttribute("href", "/changelog#v1-2-0");
  });

  it("stores the dismissed version and hides immediately", async () => {
    render(<ChangelogBanner />);

    const closeButton = await screen.findByRole("button", {
      name: /Dismiss Memory Chess v1\.2\.0 update/i,
    });
    fireEvent.click(closeButton);

    expect(window.localStorage.getItem(CHANGELOG_DISMISSAL_STORAGE_KEY)).toBe(
      LATEST_CHANGELOG_ENTRY.version,
    );
    expect(
      screen.queryByLabelText("Memory Chess update"),
    ).not.toBeInTheDocument();
  });

  it("stays hidden after the current version was dismissed", () => {
    window.localStorage.setItem(
      CHANGELOG_DISMISSAL_STORAGE_KEY,
      LATEST_CHANGELOG_ENTRY.version,
    );

    render(<ChangelogBanner />);

    expect(
      screen.queryByLabelText("Memory Chess update"),
    ).not.toBeInTheDocument();
  });

  it("shows a newer release when only an older version was dismissed", async () => {
    window.localStorage.setItem(CHANGELOG_DISMISSAL_STORAGE_KEY, "1.1.0");

    render(<ChangelogBanner />);

    expect(
      await screen.findByLabelText("Memory Chess update"),
    ).toBeInTheDocument();
  });

  it("does not appear once the 30-day window has ended", () => {
    jest.setSystemTime(new Date("2026-09-15T00:00:00.000Z"));

    render(<ChangelogBanner />);

    expect(
      screen.queryByLabelText("Memory Chess update"),
    ).not.toBeInTheDocument();
  });

  it("disappears at the expiry boundary without a reload", async () => {
    jest.setSystemTime(new Date("2026-09-14T15:59:59.000Z"));
    render(<ChangelogBanner />);

    expect(
      await screen.findByLabelText("Memory Chess update"),
    ).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1_000);
    });

    expect(
      screen.queryByLabelText("Memory Chess update"),
    ).not.toBeInTheDocument();
  });

  it("remains usable when local storage cannot be read", async () => {
    jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("Storage unavailable");
    });

    render(<ChangelogBanner />);

    expect(
      await screen.findByLabelText("Memory Chess update"),
    ).toBeInTheDocument();
  });
});
