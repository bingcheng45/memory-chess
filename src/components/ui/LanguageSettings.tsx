"use client";

import {
  useState,
  useEffect,
  useId,
  useRef,
  useCallback,
  useTransition,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import { createPortal } from "react-dom";
import { Globe } from "lucide-react";
import { useClickAway } from "@/hooks/useClickAway";
import { usePresence } from "@/hooks/usePresence";
import { usePathname, useRouter } from "@/i18n/navigation";
import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_LABELS,
  LOCALE_BADGES,
  type Locale,
} from "@/i18n/routing";
import { isEnglishOnlyPath, isServedAtBareEnglishUrl } from "@/lib/seo/englishOnly";

/** The dark site chrome, or the homepage's Lab Paper header, whose tokens the popover reads from the root. */
type Appearance = "site" | "paper";

const LOOKS = {
  site: {
    button:
      "flex h-9 items-center gap-1.5 rounded-full bg-bg-card/30 px-2.5 backdrop-blur-sm transition-all hover:bg-bg-card/50 active:scale-[0.94] disabled:opacity-60 sm:h-10 sm:px-3",
    globe: "h-4 w-4 text-text-secondary sm:h-[18px] sm:w-[18px]",
    code: "text-xs font-semibold tracking-wide text-text-secondary sm:text-sm",
    menu: "fixed z-[99990] overflow-y-auto overscroll-contain rounded-lg border border-bg-light bg-bg-card p-2 shadow-2xl shadow-black/60",
    backdrop: "fixed inset-0 z-[99998] flex items-end bg-black/70",
    sheet: "max-h-[80vh] w-full overflow-y-auto rounded-t-2xl border-t border-bg-light bg-bg-card p-4 pb-8 shadow-2xl",
    handle: "mx-auto mb-4 h-1 w-10 rounded-full bg-bg-light",
    active: "bg-peach-500/15 text-peach-500",
    disabled: "cursor-not-allowed text-text-muted opacity-50",
    idle: "text-text-secondary hover:bg-bg-light hover:text-text-primary",
    badge: "text-xs font-medium text-text-muted",
    note: "max-w-[14rem] px-3 pb-2 text-xs leading-5 text-text-muted",
  },
  paper: {
    button:
      "flex h-10 items-center gap-1.5 rounded-md px-2.5 text-[var(--lp-ink-2)] transition-[color,background-color,transform] hover:bg-[var(--lp-surface-2)] hover:text-[var(--lp-ink)] active:scale-[0.94] disabled:opacity-60",
    globe: "h-[18px] w-[18px]",
    code: "text-sm font-medium",
    menu: "fixed z-[99990] overflow-y-auto overscroll-contain rounded-xl border border-[var(--lp-line)] bg-[var(--lp-surface)] p-2 shadow-[var(--lp-pop-shadow)]",
    backdrop: "fixed inset-0 z-[99998] flex items-end bg-[rgba(13,27,36,0.4)]",
    sheet: "max-h-[80vh] w-full overflow-y-auto rounded-t-2xl border-t border-[var(--lp-line)] bg-[var(--lp-surface)] p-4 pb-8 shadow-[var(--lp-pop-shadow)]",
    handle: "mx-auto mb-4 h-1 w-10 rounded-full bg-[var(--lp-line)]",
    active: "bg-[var(--lp-accent-soft)] text-[var(--lp-accent)]",
    disabled: "cursor-not-allowed text-[var(--lp-muted)] opacity-50",
    idle: "text-[var(--lp-ink-2)] hover:bg-[var(--lp-surface-2)] hover:text-[var(--lp-ink)]",
    badge: "text-xs font-medium text-[var(--lp-muted)]",
    note: "max-w-[14rem] px-3 pb-2 text-xs leading-5 text-[var(--lp-muted)]",
  },
} as const satisfies Record<Appearance, Record<string, string>>;

interface LanguageSettingsProps {
  className?: string;
  appearance?: Appearance;
}

const POPOVER_MS = 180;
const SHEET_MS = 300;

type Anchor = { top: number; left: number };

/**
 * Language switcher for the top-left of PageHeader.
 *
 * The button pairs a globe with the active locale code: the globe says "this
 * control is about language", the code says which one you are already in.
 *
 * Both surfaces render through a portal on document.body. The header sits
 * inside positioned ancestors and the chess board paints an overlay at z-20,
 * so a popover positioned inside the header is trapped in its stacking context
 * and disappears behind the board mid-game no matter how high its z-index is.
 * Portalling escapes that entirely.
 */
export default function LanguageSettings({
  className = "",
  appearance = "site",
}: LanguageSettingsProps) {
  const look = LOOKS[appearance];
  const t = useTranslations("common.language");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEnglishOnlyPage = isEnglishOnlyPath(pathname);
  // Picking a language this page is not served in would land the reader on the
  // English page again and still write the locale cookie.
  const isUnavailable = (option: Locale) =>
    option !== locale && option !== DEFAULT_LOCALE && isServedAtBareEnglishUrl(pathname, option);
  const englishOnlyNoteId = useId();

  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [anchor, setAnchor] = useState<Anchor | null>(null);

  const isPopoverOpen = isOpen && !isMobile && anchor !== null;
  const isSheetOpen = isOpen && isMobile;
  const popover = usePresence(isPopoverOpen, POPOVER_MS);
  const sheet = usePresence(isSheetOpen, SHEET_MS);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Same 640px breakpoint SoundSettings uses, so the two controls change
  // behaviour at the same viewport width.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // The portal is positioned in viewport coordinates, so it has to follow the
  // button when the page scrolls or resizes.
  const positionMenu = useCallback(() => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    setAnchor({ top: rect.bottom + 8, left: rect.left });
  }, []);

  useEffect(() => {
    if (!isOpen || isMobile) return;

    positionMenu();
    window.addEventListener("scroll", positionMenu, true);
    window.addEventListener("resize", positionMenu);
    return () => {
      window.removeEventListener("scroll", positionMenu, true);
      window.removeEventListener("resize", positionMenu);
    };
  }, [isOpen, isMobile, positionMenu]);

  useClickAway(wrapperRef, () => {
    if (isOpen && !isMobile) {
      setIsOpen(false);
    }
  });

  // Close on Escape -- the menu traps nothing, so this is the only way out for
  // keyboard users who opened it and changed their mind.
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  const handleSelect = (nextLocale: Locale) => {
    setIsOpen(false);

    if (nextLocale === locale || isUnavailable(nextLocale)) return;

    // `pathname` from @/i18n/navigation is already locale-stripped, but it is
    // *only* the path -- the query and hash are not in it. Replacing with the
    // bare pathname silently drops them, which resets the preset behind
    // `/game?difficulty=hard&pieceCount=8`, discards the entry-identifying
    // params on a shared `/leaderboard?player=...` result, and throws away the
    // `#faq` anchor a reader was parked on. Read them off the live location at
    // click time rather than via `useSearchParams`, which would force every
    // page hosting the header into a client-side rendering bailout.
    const { search, hash } =
      typeof window === "undefined"
        ? { search: "", hash: "" }
        : window.location;
    const href = `${pathname}${search}${hash}`;

    // next-intl persists the choice to a NEXT_LOCALE cookie, which the
    // middleware then treats as an explicit choice that outranks detection.
    startTransition(() => {
      router.replace(href, { locale: nextLocale });
    });
  };

  const localeOptions = LOCALES.map((code) => ({
    code,
    label: LOCALE_LABELS[code],
    badge: LOCALE_BADGES[code],
  }));

  const renderOption = (option: (typeof localeOptions)[number]) => {
    const isActive = option.code === locale;
    const isDisabled = isUnavailable(option.code);

    return (
      <button
        key={option.code}
        onClick={() => handleSelect(option.code)}
        lang={option.code}
        role="menuitemradio"
        aria-checked={isActive}
        disabled={isDisabled}
        aria-disabled={isDisabled || undefined}
        className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
          isActive ? look.active : isDisabled ? look.disabled : look.idle
        }`}
      >
        <span className="whitespace-nowrap">{option.label}</span>
        {isActive ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <span className={look.badge}>{option.badge}</span>
        )}
      </button>
    );
  };

  const menuItems = (
    <div className="flex flex-col gap-0.5">
      {isEnglishOnlyPage && (
        <p
          id={englishOnlyNoteId}
          className={look.note}
        >
          {t("englishOnly")}
        </p>
      )}
      {localeOptions.map(renderOption)}
    </div>
  );
  const menuDescription = isEnglishOnlyPage ? englishOnlyNoteId : undefined;

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen((open) => !open)}
        disabled={isPending}
        className={look.button}
        aria-label={t("change", { language: LOCALE_LABELS[locale] })}
        title={t("current", { language: LOCALE_LABELS[locale] })}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <Globe
          className={look.globe}
          aria-hidden="true"
        />
        <span
          key={locale}
          className={`${look.code} animate-in fade-in-60 motion-reduce:animate-none`}
          style={{ animationDuration: "250ms" }}
        >
          {LOCALE_BADGES[locale]}
        </span>
      </button>

      {isMounted &&
        createPortal(
          <>
            {popover.isPresent && anchor && (
              <div
                role="menu"
                aria-label={t("select")}
                aria-describedby={menuDescription}
                // Solid, not translucent: at 90% the chess board read straight
                // through the menu and the labels became hard to scan.
                className={`${look.menu} ${
                  popover.isClosing
                    ? "animate-out fade-out slide-out-to-bottom-[6px] fill-mode-forwards"
                    : "animate-in fade-in slide-in-from-bottom-[6px]"
                } ease-out motion-reduce:animate-none`}
                style={{
                  animationDuration: `${POPOVER_MS}ms`,
                  top: anchor.top,
                  left: anchor.left,
                  minWidth: "11rem",
                  width: "max-content",
                  // Two dozen locales will not fit on a laptop screen; cap to
                  // the space actually below the button and scroll the rest.
                  maxHeight: `calc(100vh - ${anchor.top + 16}px)`,
                }}
              >
                {menuItems}
              </div>
            )}

            {sheet.isPresent && (
              <div
                className={`${look.backdrop} ${
                  sheet.isClosing
                    ? "animate-out fade-out fill-mode-forwards"
                    : "animate-in fade-in"
                } duration-200 motion-reduce:animate-none`}
                onClick={() => setIsOpen(false)}
              >
                <div
                  role="menu"
                  aria-label={t("select")}
                  aria-describedby={menuDescription}
                  className={`${look.sheet} ${
                    sheet.isClosing
                      ? "animate-out slide-out-to-bottom fill-mode-forwards"
                      : "animate-in slide-in-from-bottom"
                  } duration-300 ease-out motion-reduce:animate-none`}
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className={look.handle} />
                  {menuItems}
                </div>
              </div>
            )}
          </>,
          document.body,
        )}
    </div>
  );
}
