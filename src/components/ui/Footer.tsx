"use client";

import { useTranslations } from "next-intl";

import { CommunityLink } from "@/components/community/CommunityLink";
import SiteLink from "@/components/ui/SiteLink";

export const FOOTER_LINKS = [
  { href: "/learn", labelKey: "nav.learn" },
  { href: "/articles", labelKey: "nav.articles" },
  { href: "/about", labelKey: "nav.about" },
  { href: "/blindfold", labelKey: "nav.blindfold" },
  { href: "/changelog", labelKey: "nav.changelog" },
  { href: "/contact-us", labelKey: "nav.contactUs" },
  { href: "/privacy", labelKey: "nav.privacy" },
  { href: "/terms", labelKey: "nav.terms" },
] as const;

const FOOTER_LINK_CLASS = "text-peach-500 transition-colors hover:text-peach-400";

export const PRODUCT_HUNT_DAY_URL =
  "https://www.producthunt.com/products/memory-chess/launches/memory-chess?embed=true&utm_source=badge-top-post-badge&utm_medium=badge&utm_campaign=badge-memory-chess";
export const PRODUCT_HUNT_WEEK_URL =
  "https://www.producthunt.com/products/memory-chess/launches/memory-chess?embed=true&utm_source=badge-top-post-topic-badge&utm_medium=badge&utm_campaign=badge-memory-chess";
export const X_URL = "https://x.com/TheMemoryChess";

type BadgeTheme = "dark" | "light";

const PRODUCT_HUNT_BADGES = [
  {
    href: PRODUCT_HUNT_DAY_URL,
    src: (theme: BadgeTheme) =>
      `https://api.producthunt.com/widgets/embed-image/v1/top-post-badge.svg?post_id=957046&theme=${theme}&period=daily&t=1771899006529`,
  },
  {
    href: PRODUCT_HUNT_WEEK_URL,
    src: (theme: BadgeTheme) =>
      `https://api.producthunt.com/widgets/embed-image/v1/top-post-topic-badge.svg?post_id=957046&theme=${theme}&period=weekly&topic_id=204&t=1771899006529`,
  },
] as const;

export function ProductHuntBadges({ theme, className }: { theme: BadgeTheme; className?: string }) {
  const t = useTranslations("common");
  return (
    <div className={className}>
      {PRODUCT_HUNT_BADGES.map((badge) => (
        <a key={badge.href} href={badge.href} target="_blank" rel="noopener noreferrer">
          {/* eslint-disable-next-line @next/next/no-img-element -- Product Hunt's own SVG, which next/image would pass through unoptimized */}
          <img
            alt={t("footer.productHuntAlt")}
            width="250"
            height="54"
            src={badge.src(theme)}
            loading="lazy"
            style={{ width: "250px", height: "54px" }}
          />
        </a>
      ))}
    </div>
  );
}

export function XIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-6 h-6"
    >
      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
    </svg>
  );
}

export default function Footer() {
  const t = useTranslations("common");
  // Passed as a string on purpose: ICU would format a bare number argument
  // with grouping separators and render the year as "2,026".
  const currentYear = String(new Date().getFullYear());

  return (
    // data-below-game: rendered by the locale layout after the game page, so
    // while body.game-fixed pins the viewport this would join the pinned flex
    // column as an unshrinkable item and squeeze the board. The rule in
    // globals.css hides everything below the game for those phases.
    <footer
      data-below-game
      className="w-full py-10 mt-10 border-t border-bg-light"
    >
      <div className="container mx-auto px-2 sm:px-4">
        <div className="mb-6 flex flex-wrap justify-center gap-x-6 gap-y-3">
          {FOOTER_LINKS.map((link) => (
            <SiteLink key={link.href} href={link.href} label={t(link.labelKey)} className={FOOTER_LINK_CLASS} prefetch={false} />
          ))}
          <CommunityLink placement="footer" className={FOOTER_LINK_CLASS}>
            {t("community.footer")}
          </CommunityLink>
        </div>

        {/* Product Hunt Badges */}
        <div className="flex justify-center mb-4">
          <ProductHuntBadges theme="dark" className="flex flex-wrap items-center justify-center gap-3" />
        </div>

        {/* Twitter/X Icon */}
        <div className="flex justify-center mb-6">
          <a
            href={X_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-secondary hover:text-peach-500 transition-colors p-2"
            aria-label={t("footer.followOnX")}
          >
            <XIcon />
          </a>
        </div>

        <div className="pt-6 text-center text-text-secondary text-sm">
          <p>{t("footer.copyright", { year: currentYear })}</p>
        </div>
      </div>
    </footer>
  );
}
