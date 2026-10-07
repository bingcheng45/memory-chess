import { act, fireEvent, render, screen } from "@/test-utils/intl";
import ChangelogBanner, { hideDismissedBannerScript } from "@/components/ui/ChangelogBanner";
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
    render(<ChangelogBanner announce />);

    const link = await screen.findByRole("link", {
      name: new RegExp(
        `Memory Chess v${LATEST_CHANGELOG_ENTRY.version.replaceAll(".", "\\.")} is here`,
        "i",
      ),
    });

    expect(link).toHaveAttribute("href", "/changelog");
  });

  it("stores the dismissed version and hides immediately", async () => {
    render(<ChangelogBanner announce />);

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

    render(<ChangelogBanner announce />);

    expect(
      screen.queryByLabelText("Memory Chess update"),
    ).not.toBeInTheDocument();
  });

  it("shows a newer release when only an older version was dismissed", async () => {
    window.localStorage.setItem(CHANGELOG_DISMISSAL_STORAGE_KEY, "1.1.0");

    render(<ChangelogBanner announce />);

    expect(
      await screen.findByLabelText("Memory Chess update"),
    ).toBeInTheDocument();
  });

  it("does not appear once the 30-day window has ended", () => {
    jest.setSystemTime(
      new Date(publishedAt + CHANGELOG_ANNOUNCEMENT_DURATION_MS),
    );

    render(<ChangelogBanner announce />);

    expect(
      screen.queryByLabelText("Memory Chess update"),
    ).not.toBeInTheDocument();
  });

  it("disappears at the expiry boundary without a reload", async () => {
    jest.setSystemTime(
      new Date(publishedAt + CHANGELOG_ANNOUNCEMENT_DURATION_MS - 1_000),
    );
    render(<ChangelogBanner announce />);

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

    render(<ChangelogBanner announce />);

    expect(
      await screen.findByLabelText("Memory Chess update"),
    ).toBeInTheDocument();
  });
});

describe("ChangelogBanner in the served HTML", () => {
  const publishedAt = Date.parse(LATEST_CHANGELOG_ENTRY.publishedAt);
  const expiresAt = publishedAt + CHANGELOG_ANNOUNCEMENT_DURATION_MS;

  function servedBannerAfterScript(): HTMLElement {
    document.body.innerHTML = '<aside id="changelog-banner">update</aside>';
    new Function(hideDismissedBannerScript(LATEST_CHANGELOG_ENTRY.version, expiresAt))();
    return document.getElementById("changelog-banner")!;
  }

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(publishedAt + 24 * 60 * 60 * 1000));
    window.localStorage.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
    document.body.innerHTML = "";
  });

  it("renders nothing for a page rendered outside the release's window", () => {
    render(<ChangelogBanner announce={false} />);

    expect(screen.queryByLabelText("Memory Chess update")).not.toBeInTheDocument();
  });

  it("leaves the served banner showing for a reader who has not dismissed it", () => {
    expect(servedBannerAfterScript().hidden).toBe(false);
  });

  it("hides the served banner before paint for a reader who dismissed this release", () => {
    window.localStorage.setItem(CHANGELOG_DISMISSAL_STORAGE_KEY, LATEST_CHANGELOG_ENTRY.version);

    expect(servedBannerAfterScript().hidden).toBe(true);
  });

  it("hides the served banner before paint once the window has ended", () => {
    jest.setSystemTime(new Date(expiresAt));

    expect(servedBannerAfterScript().hidden).toBe(true);
  });
});

