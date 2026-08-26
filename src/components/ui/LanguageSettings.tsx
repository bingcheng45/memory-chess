"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
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

/**
 * Language switcher for the top-left of PageHeader, built as the deliberate
 * mirror of SoundSettings on the right: same button geometry, same glass
 * treatment, same popover motion. The circle shows the active locale badge
 * rather than a globe -- a globe tells you the control exists but never tells
 * you which language you are currently in.
 */
export default function LanguageSettings({
  className = "",
}: LanguageSettingsProps) {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);

  // Mounted check, for the mobile sheet portal
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

  useClickAway(wrapperRef, () => {
    if (isOpen && !isMobile) {
      setIsOpen(false);
    }
  });

  // Close on Escape -- the popover traps nothing, so this is the only way out
  // for keyboard users who opened it and changed their mind.
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

    // `pathname` from @/i18n/navigation is already locale-stripped, so this
    // keeps the reader on the same page in their new language. next-intl
    // persists the choice to a NEXT_LOCALE cookie.
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
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
        aria-current={isActive ? "true" : undefined}
        className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
          isActive
            ? "bg-bg-light/60 text-peach-500"
            : "text-text-secondary hover:bg-bg-light/40 hover:text-text-primary"
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

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <motion.button
        onClick={() => setIsOpen((open) => !open)}
        whileTap={{ scale: 0.9 }}
        disabled={isPending}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-bg-card/30 backdrop-blur-sm transition-all hover:bg-bg-card/50 disabled:opacity-60 sm:h-10 sm:w-10"
        aria-label={`Change language, current language ${LOCALE_LABELS[locale]}`}
        title={`Language: ${LOCALE_LABELS[locale]}`}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <motion.span
          key={locale}
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="text-xs font-semibold tracking-wide text-text-secondary sm:text-sm"
        >
          {LOCALE_BADGES[locale]}
        </motion.span>
      </motion.button>

      {/* Desktop popover -- mirrors the volume slider's anchoring, left instead of right */}
      <AnimatePresence>
        {!isMobile && isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            role="menu"
            aria-label="Select language"
            className="absolute z-10 rounded-lg bg-bg-card/90 p-2 shadow-lg backdrop-blur-sm"
            style={{
              top: "100%",
              left: 0,
              marginTop: "8px",
              width: "max-content",
              minWidth: "11rem",
            }}
          >
            <div className="flex flex-col gap-0.5">
              {localeOptions.map(renderOption)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile bottom sheet -- ten rows in a 36px-anchored popover is unusable */}
      {isMounted &&
        isMobile &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[99998] flex items-end bg-black/60 backdrop-blur-sm"
                onClick={() => setIsOpen(false)}
              >
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", stiffness: 320, damping: 32 }}
                  role="menu"
                  aria-label="Select language"
                  className="max-h-[80vh] w-full overflow-y-auto rounded-t-2xl bg-bg-card p-4 pb-8 shadow-xl"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-bg-light" />
                  <div className="flex flex-col gap-1">
                    {localeOptions.map(renderOption)}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}
