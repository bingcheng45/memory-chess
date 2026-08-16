import { act, fireEvent, render, screen } from "@testing-library/react";
import ChangelogBanner from "@/components/ui/ChangelogBanner";
import {
  CHANGELOG_ANNOUNCEMENT_DURATION_MS,
  CHANGELOG_DISMISSAL_STORAGE_KEY,
  LATEST_CHANGELOG_ENTRY,
} from "@/lib/changelog";

describe("ChangelogBanner", () => {
  const publishedAt = Date.parse(LATEST_CHANGELOG_ENTRY.publishedAt);

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(publishedAt + 24 * 60 * 60 * 1000));
    window.localStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it("links to the latest changelog during its announcement window", async () => {
    render(<ChangelogBanner />);

    const link = await screen.findByRole("link", {
      name: new RegExp(
        `Memory Chess v${LATEST_CHANGELOG_ENTRY.version.replaceAll(".", "\\.")} is here`,
        "i",
      ),
    });

    expect(link).toHaveAttribute("href", "/changelog");
  });

  it("stores the dismissed version and hides immediately", async () => {
    render(<ChangelogBanner />);

    const closeButton = await screen.findByRole("button", {
      name: `Dismiss Memory Chess v${LATEST_CHANGELOG_ENTRY.version} update`,
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
    jest.setSystemTime(
      new Date(publishedAt + CHANGELOG_ANNOUNCEMENT_DURATION_MS),
    );

    render(<ChangelogBanner />);

    expect(
      screen.queryByLabelText("Memory Chess update"),
    ).not.toBeInTheDocument();
  });

  it("disappears at the expiry boundary without a reload", async () => {
    jest.setSystemTime(
      new Date(publishedAt + CHANGELOG_ANNOUNCEMENT_DURATION_MS - 1_000),
    );
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
