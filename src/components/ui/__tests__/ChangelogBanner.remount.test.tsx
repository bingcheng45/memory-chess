import { act } from "react";
import { hydrateRoot } from "react-dom/client";
import { NextIntlClientProvider } from "next-intl";
import ChangelogBanner, { hideDismissedBannerScript } from "@/components/ui/ChangelogBanner";
import {
  CHANGELOG_ANNOUNCEMENT_DURATION_MS,
  CHANGELOG_DISMISSAL_STORAGE_KEY,
  LATEST_CHANGELOG_ENTRY,
} from "@/lib/changelog";
import { render } from "@/test-utils/intl";
import messages from "../../../../messages/en.json";

// The browser build of react-dom/server needs MessageChannel, which jsdom lacks; the server uses the node build.
const { renderToString } = jest.requireActual<typeof import("react-dom/server")>("react-dom/server.node");

const publishedAt = Date.parse(LATEST_CHANGELOG_ENTRY.publishedAt);
const expiresAt = publishedAt + CHANGELOG_ANNOUNCEMENT_DURATION_MS;
const page = (
  <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
    <ChangelogBanner announce />
  </NextIntlClientProvider>
);

function bannersAdded(records: MutationRecord[]): number {
  return records
    .flatMap((record) => [...record.addedNodes])
    .filter((node) => node instanceof HTMLElement && (node.id === "changelog-banner" || node.querySelector("#changelog-banner")))
    .length;
}

// Order matters: the first test is the page's first hydration, the second a later client-side remount.
describe("ChangelogBanner across a hydration and a later remount", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(publishedAt + 24 * 60 * 60 * 1000));
    window.localStorage.setItem(CHANGELOG_DISMISSAL_STORAGE_KEY, LATEST_CHANGELOG_ENTRY.version);
  });

  afterEach(() => {
    jest.useRealTimers();
    window.localStorage.clear();
    document.body.innerHTML = "";
  });

  it("hydrates the served banner without a mismatch for a dismissed reader, then removes it", async () => {
    const container = document.createElement("div");
    container.innerHTML = renderToString(page);
    document.body.append(container);
    new Function(hideDismissedBannerScript(LATEST_CHANGELOG_ENTRY.version, expiresAt))();
    const recoverable = jest.fn();

    expect(container.querySelector("#changelog-banner")).not.toBeNull();
    await act(async () => {
      hydrateRoot(container, page, { onRecoverableError: recoverable });
    });

    expect(recoverable).not.toHaveBeenCalled();
    expect(container.querySelector("#changelog-banner")).toBeNull();
  });

  it("never inserts the banner when a locale switch remounts it for a dismissed reader", () => {
    const observer = new MutationObserver(() => {});
    observer.observe(document.body, { childList: true, subtree: true });

    render(<ChangelogBanner announce />);

    expect(bannersAdded(observer.takeRecords())).toBe(0);
    observer.disconnect();
  });
});
