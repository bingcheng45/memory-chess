"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import EnglishOnlyLink from "@/components/ui/EnglishOnlyLink";
import { LAB_PAPER_CLASS } from "@/components/lab-paper/shell";
import { useIsLabPaperRoute } from "@/lib/lab-paper/useIsLabPaperRoute";
import {
  CHANGELOG_ANNOUNCEMENT_DURATION_MS,
  CHANGELOG_DISMISSAL_STORAGE_KEY,
  isAnnouncementActive,
} from "@/lib/changelog/announcement";

const BANNER_ID = "changelog-banner";

/** The dark site shell, or a Lab Paper route, where the banner sits in its own paper block above the page's header. */
type Appearance = "site" | "paper";

const LOOKS = {
  site: {
    aside: "w-full border-b border-white/10 bg-bg-card text-text-secondary",
    row: "container relative mx-auto flex min-h-10 items-center justify-center px-12 py-2 text-center text-xs sm:text-sm",
    link: "group rounded-sm outline-none transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-peach-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-card",
    lead: "font-medium text-text-primary",
    cta: "whitespace-nowrap text-peach-400 underline decoration-peach-400/40 underline-offset-4 transition-colors group-hover:text-peach-300",
    close:
      "absolute right-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peach-500 sm:right-4",
  },
  paper: {
    aside: "lab-banner",
    row: "lab-banner-row",
    link: undefined,
    lead: "lab-banner-lead",
    cta: "lab-banner-cta",
    close: "lab-banner-close",
  },
} as const satisfies Record<Appearance, Record<string, string | undefined>>;

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
 * `version` and `publishedAt` come from the server so the client never loads
 * the whole changelog.
 */
export default function ChangelogBanner({
  announce,
  version,
  publishedAt,
}: {
  announce: boolean;
  version: string;
  publishedAt: string;
}) {
  const t = useTranslations("changelog");
  const appearance: Appearance = useIsLabPaperRoute() ? "paper" : "site";
  const expiresAt = Date.parse(publishedAt) + CHANGELOG_ANNOUNCEMENT_DURATION_MS;
  // The server and the first hydration render `announce` as is, so the served HTML always matches.
  const [isVisible, setIsVisible] = useState(
    () => announce && (!hasHydrated || shouldShow(version, expiresAt)),
  );

  useEffect(() => {
    hasHydrated = true;
  }, []);

  useEffect(() => {
    if (!announce) {
      return;
    }

    if (!isAnnouncementActive(publishedAt)) {
      setIsVisible(false);
      return;
    }

    setIsVisible(shouldShow(version, expiresAt));

    const handleStorage = (event: StorageEvent) => {
      if (event.key === CHANGELOG_DISMISSAL_STORAGE_KEY) {
        setIsVisible(event.newValue !== version);
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
  }, [announce, version, publishedAt, expiresAt]);

  const handleDismiss = () => {
    try {
      window.localStorage.setItem(
        CHANGELOG_DISMISSAL_STORAGE_KEY,
        version,
      );
    } catch {
      // Dismiss for this page view even when browser storage is unavailable.
    }

    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  const look = LOOKS[appearance];
  const banner = (
    <>
      <aside
        id={BANNER_ID}
        aria-label={t("bannerLabel")}
        // The script below may already have set `hidden` on the served node.
        suppressHydrationWarning
        className={look.aside}
      >
        <div className={look.row}>
          <EnglishOnlyLink href="/changelog" className={look.link}>
            {(suffix) => (
              <>
                <span className={look.lead}>
                  {t("bannerLead", { version: version })}
                </span>{" "}
                <span className={look.cta}>
                  {t("bannerCta")}
                  {suffix}
                </span>
              </>
            )}
          </EnglishOnlyLink>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label={`Dismiss Memory Chess v${version} update`}
            className={look.close}
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      </aside>
      <script
        dangerouslySetInnerHTML={{
          __html: hideDismissedBannerScript(version, expiresAt),
        }}
      />
    </>
  );

  return appearance === "paper" ? <div className={LAB_PAPER_CLASS}>{banner}</div> : banner;
}
