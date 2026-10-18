"use client";

import { useEffect, useState, type RefObject } from "react";
import { useTranslations } from "next-intl";

export const ROUND_SAVED_TOAST_MS = 3000;

// Rounds already announced, so a result screen drawn again for the same round stays quiet.
const announced = new Set<string>();

const inView = (element: HTMLElement) => {
  const { top, bottom } = element.getBoundingClientRect();
  return top < window.innerHeight && bottom > 0;
};

export interface RoundSavedToastProps {
  readonly roundId: string;
  /** The dashboard figures under the result: what "Show me" scrolls to, and whose being on screen already makes the toast moot. */
  readonly target: RefObject<HTMLElement | null>;
  /** The result screen asks for feedback, and the toast never stacks with that dialog. */
  readonly feedbackAsked: boolean;
}

/** Tells the player, once per round, that the round is saved and its dashboard figures wait below the fold. */
export default function RoundSavedToast({ roundId, target, feedbackAsked }: RoundSavedToastProps) {
  const t = useTranslations("game.result.savedToast");
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const section = target.current;
    if (!section || announced.has(roundId)) return;
    announced.add(roundId);
    if (!inView(section) && !feedbackAsked) setOpen(true);
  }, [roundId, target, feedbackAsked]);

  useEffect(() => {
    if (!open || hovered || focused) return;
    const timer = setTimeout(() => setOpen(false), ROUND_SAVED_TOAST_MS);
    return () => clearTimeout(timer);
  }, [open, hovered, focused]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const showMe = () => {
    const section = target.current;
    setOpen(false);
    if (!section) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    section.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "start" });
    section.focus({ preventScroll: true });
  };

  return (
    <div role="status" className="lab-saved-toast-region">
      {open && (
        <div
          className="lab-saved-toast"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        >
          <span>{t("message")}</span>
          <button type="button" className="lab-saved-toast-action" onClick={showMe}>
            {t("action")}
          </button>
        </div>
      )}
    </div>
  );
}
