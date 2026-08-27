"use client";

import { Link } from "@/i18n/navigation";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  CHANGELOG_ANNOUNCEMENT_DURATION_MS,
  CHANGELOG_DISMISSAL_STORAGE_KEY,
  LATEST_CHANGELOG_ENTRY,
  isChangelogAnnouncementActive,
} from "@/lib/changelog";

export default function ChangelogBanner() {
  const t = useTranslations("changelog");
  const [isVisible, setIsVisible] = useState(false);
  const release = LATEST_CHANGELOG_ENTRY;

  useEffect(() => {
    if (!isChangelogAnnouncementActive(release)) {
      return;
    }

    try {
      const dismissedVersion = window.localStorage.getItem(
        CHANGELOG_DISMISSAL_STORAGE_KEY,
      );
      setIsVisible(dismissedVersion !== release.version);
    } catch {
      setIsVisible(true);
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === CHANGELOG_DISMISSAL_STORAGE_KEY) {
        setIsVisible(event.newValue !== release.version);
      }
    };

    window.addEventListener("storage", handleStorage);

    const expiresAt =
      Date.parse(release.publishedAt) + CHANGELOG_ANNOUNCEMENT_DURATION_MS;
    let expiryTimer: number | undefined;

    const scheduleExpiry = () => {
      const remainingTime = expiresAt - Date.now();

      if (remainingTime <= 0) {
        setIsVisible(false);
        return;
      }

      // Browsers clamp longer delays, so schedule the 30-day window in safe chunks.
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
  }, [release]);

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
    <aside
      aria-label={t("bannerLabel")}
      className="w-full border-b border-white/10 bg-bg-card text-text-secondary"
    >
      <div className="container relative mx-auto flex min-h-10 items-center justify-center px-12 py-2 text-center text-xs sm:text-sm">
        <Link
          href="/changelog"
          className="group rounded-sm outline-none transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-peach-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-card"
        >
          <span className="font-medium text-text-primary">
            Memory Chess v{release.version} is here.
          </span>{" "}
          <span className="whitespace-nowrap text-peach-400 underline decoration-peach-400/40 underline-offset-4 transition-colors group-hover:text-peach-300">{t("bannerCta")}</span>
        </Link>

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
  );
}
