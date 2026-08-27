"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useTransition,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { Globe } from "lucide-react";
import { useClickAway } from "@/hooks/useClickAway";
import { usePathname, useRouter } from "@/i18n/navigation";
import {
  LOCALES,
  LOCALE_LABELS,
  LOCALE_BADGES,
  type Locale,
} from "@/i18n/routing";

interface LanguageSettingsProps {
  className?: string;
}

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
}: LanguageSettingsProps) {
  const t = useTranslations("common.language");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [anchor, setAnchor] = useState<Anchor | null>(null);

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

    if (nextLocale === locale) return;

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

    return (
      <button
        key={option.code}
        onClick={() => handleSelect(option.code)}
        lang={option.code}
        role="menuitemradio"
        aria-checked={isActive}
        className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
          isActive
            ? "bg-peach-500/15 text-peach-500"
            : "text-text-secondary hover:bg-bg-light hover:text-text-primary"
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
          <span className="text-xs font-medium text-text-muted">
            {option.badge}
          </span>
        )}
      </button>
    );
  };

  const menuItems = (
    <div className="flex flex-col gap-0.5">
      {localeOptions.map(renderOption)}
    </div>
  );

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <motion.button
        ref={buttonRef}
        onClick={() => setIsOpen((open) => !open)}
        whileTap={{ scale: 0.94 }}
        disabled={isPending}
        className="flex h-9 items-center gap-1.5 rounded-full bg-bg-card/30 px-2.5 backdrop-blur-sm transition-all hover:bg-bg-card/50 disabled:opacity-60 sm:h-10 sm:px-3"
        aria-label={t("change", { language: LOCALE_LABELS[locale] })}
        title={t("current", { language: LOCALE_LABELS[locale] })}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <Globe
          className="h-4 w-4 text-text-secondary sm:h-[18px] sm:w-[18px]"
          aria-hidden="true"
        />
        <motion.span
          key={locale}
          initial={{ opacity: 0.6 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="text-xs font-semibold tracking-wide text-text-secondary sm:text-sm"
        >
          {LOCALE_BADGES[locale]}
        </motion.span>
      </motion.button>

      {isMounted &&
        createPortal(
          <AnimatePresence>
            {isOpen && !isMobile && anchor && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.18 }}
                role="menu"
                aria-label={t("select")}
                // Solid, not translucent: at 90% the chess board read straight
                // through the menu and the labels became hard to scan.
                className="fixed z-[99990] overflow-y-auto overscroll-contain rounded-lg border border-bg-light bg-bg-card p-2 shadow-2xl shadow-black/60"
                style={{
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
              </motion.div>
            )}

            {isOpen && isMobile && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[99998] flex items-end bg-black/70"
                onClick={() => setIsOpen(false)}
              >
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", stiffness: 320, damping: 32 }}
                  role="menu"
                  aria-label={t("select")}
                  className="max-h-[80vh] w-full overflow-y-auto rounded-t-2xl border-t border-bg-light bg-bg-card p-4 pb-8 shadow-2xl"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-bg-light" />
                  {menuItems}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}
