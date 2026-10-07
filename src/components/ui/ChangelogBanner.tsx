"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import EnglishOnlyLink from "@/components/ui/EnglishOnlyLink";
import {
  CHANGELOG_ANNOUNCEMENT_DURATION_MS,
  CHANGELOG_DISMISSAL_STORAGE_KEY,
  LATEST_CHANGELOG_ENTRY,
  isChangelogAnnouncementActive,
} from "@/lib/changelog";

const BANNER_ID = "changelog-banner";

/**
 * False until the first hydration has committed. A later client-side mount,
 * such as the layout remounting on a locale switch, has no served node to
 * match, so it can read the dismissal before its first render instead of
 * flashing the banner.
 */
let hasHydrated = false;

function shouldShow(version: string, expiresAt: number): boolean {
  if (Date.now() >= expiresAt) return false;
  try {
    return window.localStorage.getItem(CHANGELOG_DISMISSAL_STORAGE_KEY) !== version;
  } catch {
    return true;
  }
}

/**
 * Hides the served banner as it is parsed, before first paint, for a reader
 * who dismissed this release or arrives after its window. The effect below
 * then removes it, so the page never moves.
 */
export function hideDismissedBannerScript(version: string, expiresAt: number): string {
  return `(function () {
  try {
    var banner = document.getElementById(${JSON.stringify(BANNER_ID)});
    if (banner && (Date.now() >= ${expiresAt} || localStorage.getItem(${JSON.stringify(CHANGELOG_DISMISSAL_STORAGE_KEY)}) === ${JSON.stringify(version)})) {
      banner.hidden = true;
    }
  } catch (error) {}
})();`;
}

/**
 * `announce` is whether the release was inside its window when the page was
 * rendered. The banner is then part of the served HTML, so it takes its space
 * before first paint instead of pushing the page down after hydration.
 */
export default function ChangelogBanner({ announce }: { announce: boolean }) {
  const t = useTranslations("changelog");
  const release = LATEST_CHANGELOG_ENTRY;
  const expiresAt =
    Date.parse(release.publishedAt) + CHANGELOG_ANNOUNCEMENT_DURATION_MS;
  // The server and the first hydration render `announce` as is, so the served HTML always matches.
  const [isVisible, setIsVisible] = useState(
    () => announce && (!hasHydrated || shouldShow(release.version, expiresAt)),
  );

  useEffect(() => {
    hasHydrated = true;
  }, []);

  useEffect(() => {
    if (!announce) {
      return;
    }

    if (!isChangelogAnnouncementActive(release)) {
      setIsVisible(false);
      return;
    }

    setIsVisible(shouldShow(release.version, expiresAt));

    const handleStorage = (event: StorageEvent) => {
      if (event.key === CHANGELOG_DISMISSAL_STORAGE_KEY) {
        setIsVisible(event.newValue !== release.version);
      }
    };

    window.addEventListener("storage", handleStorage);

    let expiryTimer: number | undefined;

    const scheduleExpiry = () => {
      const remainingTime = expiresAt - Date.now();

      if (remainingTime <= 0) {
        setIsVisible(false);
        return;
      }

      // Browsers fire delays above 2^31 - 1 ms at once, so schedule the 30-day window in safe chunks.
      expiryTimer = window.setTimeout(
        scheduleExpiry,
        Math.min(remainingTime, 2_147_483_647),
      );
    };

    scheduleExpiry();

    return () => {
      window.removeEventListener("storage", handleStorage);
      if (expiryTimer !== undefined) {
        window.clearTimeout(expiryTimer);
      }
    };
  }, [announce, release, expiresAt]);

  const handleDismiss = () => {
    try {
      window.localStorage.setItem(
        CHANGELOG_DISMISSAL_STORAGE_KEY,
        release.version,
      );
    } catch {
      // Dismiss for this page view even when browser storage is unavailable.
    }

    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <>
      <aside
        id={BANNER_ID}
        aria-label={t("bannerLabel")}
        // The script below may already have set `hidden` on the served node.
        suppressHydrationWarning
        className="w-full border-b border-white/10 bg-bg-card text-text-secondary"
      >
        <div className="container relative mx-auto flex min-h-10 items-center justify-center px-12 py-2 text-center text-xs sm:text-sm">
          <EnglishOnlyLink
            href="/changelog"
            className="group rounded-sm outline-none transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-peach-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-card"
          >
            {(suffix) => (
              <>
                <span className="font-medium text-text-primary">
                  Memory Chess v{release.version} is here.
                </span>{" "}
                <span className="whitespace-nowrap text-peach-400 underline decoration-peach-400/40 underline-offset-4 transition-colors group-hover:text-peach-300">
                  {t("bannerCta")}
                  {suffix}
                </span>
              </>
            )}
          </EnglishOnlyLink>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label={`Dismiss Memory Chess v${release.version} update`}
            className="absolute right-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peach-500 sm:right-4"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      </aside>
      <script
        dangerouslySetInnerHTML={{
          __html: hideDismissedBannerScript(release.version, expiresAt),
        }}
      />
    </>
  );
}
