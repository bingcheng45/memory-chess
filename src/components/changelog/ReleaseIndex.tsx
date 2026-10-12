"use client";

import { useEffect, useId, useRef, useState, type RefObject } from "react";

export interface ReleaseIndexItem {
  readonly id: string;
  readonly version: string;
  readonly title: string;
  readonly date: string;
  readonly dateTime: string;
}

export interface ReleasePosition {
  readonly id: string;
  /** The release's top edge, in viewport pixels. */
  readonly top: number;
}

export interface ReadingState {
  /** A release whose top is at or above this line is being read. */
  readonly line: number;
  readonly atEnd: boolean;
  readonly hashId: string;
  readonly viewportHeight: number;
}

/** Pixels past the landing line a jumped-to release may sit and still count as the one being read. */
const READING_SLACK_PX = 8;
const END_SLACK_PX = 2;
const KEEP_IN_VIEW_MARGIN_PX = 24;

/**
 * The release being read: the last one whose top has reached the reading line. At the end of the page the short
 * releases at the bottom can never reach the line, so there the release named in the URL wins while it is on screen,
 * and otherwise the last one.
 */
export function pickActiveRelease(positions: readonly ReleasePosition[], state: ReadingState): string | undefined {
  if (positions.length === 0) return undefined;
  if (state.atEnd) {
    const named = positions.find((position) => position.id === state.hashId);
    if (named && named.top >= 0 && named.top < state.viewportHeight) return named.id;
    return positions[positions.length - 1].id;
  }
  const reached = positions.filter((position) => position.top <= state.line);
  return (reached[reached.length - 1] ?? positions[0]).id;
}

function readActiveRelease(ids: readonly string[]): string | undefined {
  const root = document.documentElement;
  const positions = ids.flatMap((id) => {
    const element = document.getElementById(id);
    return element ? [{ id, top: element.getBoundingClientRect().top }] : [];
  });
  return pickActiveRelease(positions, {
    line: (parseFloat(getComputedStyle(root).scrollPaddingTop) || 0) + READING_SLACK_PX,
    atEnd: Math.ceil(window.scrollY + window.innerHeight) >= root.scrollHeight - END_SLACK_PX,
    hashId: decodeURIComponent(window.location.hash.slice(1)),
    viewportHeight: window.innerHeight,
  });
}

function useActiveRelease(items: readonly ReleaseIndexItem[]): string | undefined {
  const [activeId, setActiveId] = useState<string>();

  useEffect(() => {
    const ids = items.map((item) => item.id);
    let frame = 0;
    const update = () => {
      frame = 0;
      setActiveId(readActiveRelease(ids));
    };
    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("hashchange", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("hashchange", schedule);
    };
  }, [items]);

  return activeId;
}

/** Scrolls the rail itself, never the page, so the active link stays in sight when the list is taller than the rail. */
function useKeepInView(railRef: RefObject<HTMLElement | null>, activeId: string | undefined) {
  useEffect(() => {
    const rail = railRef.current;
    if (!rail || !activeId || rail.scrollHeight <= rail.clientHeight) return;
    const link = rail.querySelector<HTMLElement>(`a[href="#${CSS.escape(activeId)}"]`);
    if (!link) return;
    const top = link.offsetTop - KEEP_IN_VIEW_MARGIN_PX;
    const bottom = link.offsetTop + link.offsetHeight + KEEP_IN_VIEW_MARGIN_PX;
    if (top < rail.scrollTop) rail.scrollTop = top;
    else if (bottom > rail.scrollTop + rail.clientHeight) rail.scrollTop = bottom - rail.clientHeight;
  }, [railRef, activeId]);
}

interface ReleaseIndexProps {
  readonly items: readonly ReleaseIndexItem[];
  readonly label: string;
  readonly jumpLabel: string;
  readonly countLabel: string;
}

/**
 * Every release as a link to its anchor. Wide screens show it as a sticky rail beside the releases; narrower ones
 * fold it behind a "Jump to a release" button above them. The list is server-rendered; only the open state and the
 * release being read are set on the client.
 */
export function ReleaseIndex({ items, label, jumpLabel, countLabel }: ReleaseIndexProps) {
  const railRef = useRef<HTMLElement>(null);
  const listId = useId();
  const [open, setOpen] = useState(false);
  const activeId = useActiveRelease(items);
  useKeepInView(railRef, activeId);

  return (
    <nav ref={railRef} className="lab-log-index" aria-label={label} data-open={open ? "" : undefined}>
      <p className="lab-log-index-label">{label}</p>
      <button
        type="button"
        className="lab-log-jump"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
      >
        <span>{jumpLabel}</span>
        <span className="lab-log-jump-count">{countLabel}</span>
        <svg className="lab-chev" viewBox="0 0 10 10" aria-hidden="true">
          <path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <ol id={listId} className="lab-log-list">
        {items.map((item) => (
          <li key={item.id}>
            <a href={`#${item.id}`} aria-current={item.id === activeId ? "true" : undefined}>
              <span className="lab-log-meta">
                <span className="lab-log-version">v{item.version}</span>
                <time dateTime={item.dateTime}>{item.date}</time>
              </span>
              <span className="lab-log-title">{item.title}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
