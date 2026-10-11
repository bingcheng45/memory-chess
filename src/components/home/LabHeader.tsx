"use client";

import { useEffect, useId, useRef, useState, type RefObject } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import LanguageSettings from "@/components/ui/LanguageSettings";
import { LAB_SECTIONS, type LabSectionId } from "./SectionHeading";
import { QUICK_START_HREF } from "./links";

const PAGE_SECTIONS: readonly Extract<LabSectionId, "notebook" | "method" | "calibrate" | "tiers" | "record" | "library">[] = [
  "notebook",
  "method",
  "calibrate",
  "tiers",
  "record",
  "library",
];

/** `extra` links leave the desktop row first and stay in the phone menu. Changelog lives in the footer and the phone menu only. */
const SITE_LINKS = [
  { href: "/learn", key: "learn" },
  { href: "/articles", key: "articles" },
  { href: "/leaderboard", key: "leaderboard" },
  { href: "/dashboard", key: "progress" },
  { href: "/about", key: "about", extra: true },
] as const;

const MENU_ONLY_LINKS = [{ href: "/changelog", key: "changelog" }] as const;

/** The current run's days played, and its forgiven days, which the chip names only in its title and accessible name. */
export interface HeaderStreak {
  readonly days: number;
  readonly forgiven: number;
}

interface Disclosure {
  readonly open: boolean;
  readonly toggle: () => void;
  readonly close: () => void;
  readonly rootRef: RefObject<HTMLDivElement | null>;
  readonly triggerRef: RefObject<HTMLButtonElement | null>;
}

/** A button that shows and hides one panel: Escape closes it and returns focus to the button, as does a press outside or focus leaving it. */
function useDisclosure(): Disclosure {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onFocusIn = (event: FocusEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("focusin", onFocusIn);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("focusin", onFocusIn);
    };
  }, [open]);

  return { open, toggle: () => setOpen((value) => !value), close: () => setOpen(false), rootRef, triggerRef };
}

function Chevron() {
  return (
    <svg className="lab-chev" viewBox="0 0 10 10" aria-hidden="true">
      <path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SectionLinks({ withHints, onPick }: { withHints: boolean; onPick: () => void }) {
  const t = useTranslations("home.lab.index");
  return PAGE_SECTIONS.map((id) => (
    <li key={id}>
      <a href={`#${LAB_SECTIONS[id].anchor}`} onClick={onPick}>
        {t(id)}
        {withHints && <span>{t(`hints.${id}`)}</span>}
      </a>
    </li>
  ));
}

export function LabHeader({ streak }: { streak: HeaderStreak | null }) {
  const t = useTranslations("home.lab.index");
  const nav = useTranslations("common.nav");
  const record = useTranslations("home.lab.record.streak");
  const lab = useDisclosure();
  const menu = useDisclosure();
  const labPanelId = useId();
  const menuPanelId = useId();
  const streakNote = streak && streak.forgiven > 0 ? record("chipForgiven", { count: streak.days, forgiven: streak.forgiven }) : undefined;

  return (
    <header className="lab-header">
      <div className="lab-wrap" ref={menu.rootRef}>
        <div className="lab-header-row">
          <Link className="lab-wordmark" href="/">
            Memory <span className="text-peach-500">Chess</span>
          </Link>
          <nav className="lab-nav" aria-label="Main">
            <div className="lab-nav-item" ref={lab.rootRef}>
              <button
                type="button"
                className="lab-nav-trigger"
                ref={lab.triggerRef}
                aria-expanded={lab.open}
                aria-controls={labPanelId}
                onClick={lab.toggle}
              >
                {t("label")}
                <Chevron />
              </button>
              <div className="lab-dropdown" id={labPanelId} hidden={!lab.open}>
                <p className="lab-panel-label">{t("onPage")}</p>
                <ul>
                  <SectionLinks withHints onPick={lab.close} />
                </ul>
              </div>
            </div>
            {SITE_LINKS.map((link) => (
              <Link key={link.href} className={`lab-nav-link${"extra" in link ? " lab-nav-extra" : ""}`} href={link.href}>
                {nav(link.key)}
              </Link>
            ))}
          </nav>
          <div className="lab-header-tools">
            <LanguageSettings appearance="paper" className="lab-lang" />
            {streak && (
              <a className="lab-streak-chip" href={`#${LAB_SECTIONS.record.anchor}`} title={streakNote} aria-label={streakNote}>
                {record("chip", { count: streak.days })}
              </a>
            )}
            <Link className="lab-btn lab-btn-primary lab-btn-sm" href={QUICK_START_HREF} aria-label={t("play")}>
              <span className="lab-play-long">{t("play")}</span>
              <span className="lab-play-short">{nav("play")}</span>
            </Link>
            <button
              type="button"
              className="lab-btn lab-btn-secondary lab-btn-sm lab-menu-btn"
              ref={menu.triggerRef}
              aria-expanded={menu.open}
              aria-controls={menuPanelId}
              onClick={menu.toggle}
            >
              {t("menu")}
            </button>
          </div>
        </div>
        <nav className="lab-menu" id={menuPanelId} aria-label={t("menu")} hidden={!menu.open}>
          <div className="lab-menu-cols">
            <div>
              <p className="lab-panel-label">{t("onPage")}</p>
              <ul>
                <SectionLinks withHints={false} onPick={menu.close} />
              </ul>
            </div>
            <div>
              <p className="lab-panel-label">{t("site")}</p>
              <ul>
                {[...SITE_LINKS, ...MENU_ONLY_LINKS].map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} onClick={menu.close}>
                      {nav(link.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="lab-menu-tools">
            <LanguageSettings appearance="paper" />
          </div>
        </nav>
      </div>
    </header>
  );
}
