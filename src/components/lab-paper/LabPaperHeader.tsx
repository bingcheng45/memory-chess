"use client";

import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import LanguageSettings from "@/components/ui/LanguageSettings";
import SiteLink from "@/components/ui/SiteLink";
import { QUICK_START_HREF } from "@/components/home/links";
import { useDailyState } from "@/hooks/useDailyState";
import { HeaderStreakChip } from "./HeaderStreakChip";
import "./lab-paper.css";
import "./lab-header-fit.css";

/** `extra` links leave the desktop row first and stay in the phone menu. Changelog lives in the footer and the phone menu only. */
const SITE_LINKS = [
  { href: "/game", key: "play" },
  { href: "/learn", key: "learn" },
  { href: "/articles", key: "articles" },
  { href: "/leaderboard", key: "leaderboard" },
  { href: "/dashboard", key: "dashboard" },
  { href: "/about", key: "about", extra: true },
] as const;

const MENU_ONLY_LINKS = [{ href: "/changelog", key: "changelog" }] as const;

export interface PageSectionLink {
  readonly href: `#${string}`;
  readonly label: string;
  readonly hint?: string;
}

/** A page's own sections: a dropdown named `trigger` on wide screens, a column headed `heading` in the phone menu. */
export interface PageSections {
  readonly trigger: string;
  readonly heading: string;
  readonly links: readonly PageSectionLink[];
}

export interface LabPaperHeaderProps {
  readonly sections?: PageSections;
  /** The Play button's wide-screen label and accessible name; phones show the short "Play". */
  readonly playLabel?: string;
  /** False on the game itself, where Play would link to the page already open and start nothing. */
  /** Page-specific tools placed before Play, such as the game's sound toggle. */
  readonly tools?: ReactNode;
  readonly showPlay?: boolean;
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

function SectionLinks({ links, withHints, onPick }: { links: readonly PageSectionLink[]; withHints: boolean; onPick: () => void }) {
  return links.map((link) => (
    <li key={link.href}>
      <a href={link.href} onClick={onPick}>
        {link.label}
        {withHints && link.hint && <span>{link.hint}</span>}
      </a>
    </li>
  ));
}

type SiteLinkItem = (typeof SITE_LINKS)[number] | (typeof MENU_ONLY_LINKS)[number];

interface SiteLinkWithDailyDotProps {
  readonly link: SiteLinkItem;
  readonly dailyReady: boolean;
  readonly className?: string;
  readonly onClick?: () => void;
  readonly "aria-current"?: "page";
}

function SiteLinkWithDailyDot({ link, dailyReady, ...props }: SiteLinkWithDailyDotProps) {
  const nav = useTranslations("common.nav");
  const entry = useTranslations("dailyEntry");
  const label = nav(link.key);
  if (link.href !== "/dashboard" || !dailyReady) return <SiteLink href={link.href} label={label} {...props} />;
  return (
    <Link href={link.href} {...props} aria-label={entry("navReady", { label })}>
      {label}
      <span className="lab-daily-dot" aria-hidden="true" />
    </Link>
  );
}

function isCurrent(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function LabPaperHeader({ sections, playLabel, tools, showPlay = true }: LabPaperHeaderProps) {
  const nav = useTranslations("common.nav");
  const entry = useTranslations("dailyEntry");
  const pathname = usePathname();
  const dailyReady = useDailyState()?.status === "ready";
  const pageMenu = useDisclosure();
  const menu = useDisclosure();
  const pagePanelId = useId();
  const menuPanelId = useId();
  const dailyHintId = useId();
  const currentOf = (href: string) => (isCurrent(pathname, href) ? ("page" as const) : undefined);

  return (
    <header className="lab-header">
      <div className="lab-wrap" ref={menu.rootRef}>
        <div className="lab-header-row">
          <Link className="lab-wordmark" href="/">
            Memory <span className="lab-wordmark-chess">Chess</span>
          </Link>
          <nav className="lab-nav" aria-label="Main">
            {SITE_LINKS.map((link) => (
              <SiteLinkWithDailyDot
                key={link.href}
                link={link}
                dailyReady={dailyReady}
                className={`lab-nav-link${"extra" in link ? " lab-nav-extra" : ""}`}
                aria-current={currentOf(link.href)}
              />
            ))}
            {sections && (
              <div className="lab-nav-item" ref={pageMenu.rootRef}>
                <button
                  type="button"
                  className="lab-nav-trigger"
                  ref={pageMenu.triggerRef}
                  aria-expanded={pageMenu.open}
                  aria-controls={pagePanelId}
                  onClick={pageMenu.toggle}
                >
                  {sections.trigger}
                  <Chevron />
                </button>
                <div className="lab-dropdown" id={pagePanelId} hidden={!pageMenu.open}>
                  <p className="lab-panel-label">{sections.heading}</p>
                  <ul>
                    <SectionLinks links={sections.links} withHints onPick={pageMenu.close} />
                  </ul>
                </div>
              </div>
            )}
          </nav>
          <div className="lab-header-tools">
            <LanguageSettings appearance="paper" className="lab-lang" />
            <HeaderStreakChip />
            {tools}
            {showPlay && (
              <Link className="lab-btn lab-btn-primary lab-btn-sm" href={QUICK_START_HREF} aria-label={playLabel}>
                <span className="lab-play-long">{playLabel ?? nav("play")}</span>
                <span className="lab-play-short">{nav("play")}</span>
              </Link>
            )}
            <button
              type="button"
              className="lab-btn lab-btn-secondary lab-btn-sm lab-menu-btn"
              ref={menu.triggerRef}
              aria-expanded={menu.open}
              aria-controls={menuPanelId}
              onClick={menu.toggle}
              aria-label={nav("menu")}
              aria-describedby={dailyReady ? dailyHintId : undefined}
            >
              <svg className="lab-menu-icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
                <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <span className="lab-menu-label">{nav("menu")}</span>
              {dailyReady && (
                <>
                  <span className="lab-daily-dot" aria-hidden="true" />
                  <span id={dailyHintId} className="sr-only">
                    {entry("navReady", { label: nav("dashboard") })}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
        <nav className="lab-menu" id={menuPanelId} aria-label={nav("menu")} hidden={!menu.open}>
          <div className="lab-menu-cols">
            {sections && (
              <div>
                <p className="lab-panel-label">{sections.heading}</p>
                <ul>
                  <SectionLinks links={sections.links} withHints={false} onPick={menu.close} />
                </ul>
              </div>
            )}
            <div>
              <p className="lab-panel-label">{nav("site")}</p>
              <ul>
                {[...SITE_LINKS, ...MENU_ONLY_LINKS].map((link) => (
                  <li key={link.href}>
                    <SiteLinkWithDailyDot link={link} dailyReady={dailyReady} onClick={menu.close} aria-current={currentOf(link.href)} />
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
