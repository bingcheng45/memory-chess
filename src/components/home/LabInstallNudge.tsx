"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { useTranslations } from "next-intl";
import { INSTALL_NUDGE_KEY, parseNudgeSeen, showsInstallNudge } from "@/lib/lab/installNudge";
import { choiceStore } from "./labChoices";
import { useFirstSight } from "./useFirstSight";
import { useIsSafari } from "./useIsSafari";

const nudgeSeen = choiceStore<number>(INSTALL_NUDGE_KEY, parseNudgeSeen);
const markSeen = () => nudgeSeen.update((current) => current ?? Date.now());

interface Placement {
  /** A Home Screen app already keeps its own record, so it is never asked to install itself. */
  readonly installed: boolean;
  readonly belowScreen: boolean;
}

/**
 * Read once as the record loads; nothing reserves the note's height, so it may only appear where no one is looking.
 * The observer's first report carries the box from the browser's own next layout, where reading it here would force one.
 */
function usePlacement(place: RefObject<HTMLDivElement | null>): Placement | null {
  const [placement, setPlacement] = useState<Placement | null>(null);
  useEffect(() => {
    const node = place.current;
    if (!node) return;
    const standalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const installed = standalone || window.matchMedia?.("(display-mode: standalone)")?.matches === true;
    const observer = new IntersectionObserver((entries) => {
      observer.disconnect();
      setPlacement({ installed, belowScreen: entries[0].boundingClientRect.top >= window.innerHeight });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [place]);
  return placement;
}

export function LabInstallNudge({ days }: { days: number }) {
  const t = useTranslations("home.lab.record.tools.nudge");
  const seenAt = nudgeSeen.useValue();
  const place = useRef<HTMLDivElement>(null);
  const placement = usePlacement(place);
  const isSafari = useIsSafari();
  const [seenHere, setSeenHere] = useState(false);
  const onSight = useCallback(() => {
    setSeenHere(true);
    markSeen();
  }, []);
  const ref = useFirstSight<HTMLDivElement>(onSight);

  const shown = showsInstallNudge({ days, installed: placement?.installed ?? null, belowScreen: placement?.belowScreen ?? null, seenAt, seenHere });

  const dismiss = () => {
    setSeenHere(false);
    markSeen();
  };

  return (
    <div className="lab-nudge-place" ref={place}>
      {shown && (
        <div className="lab-nudge" ref={ref}>
          <div>
            <p className="lab-k">{t("title")}</p>
            <p className="lab-panel-desc">{t("body")}</p>
            {isSafari && <p className="lab-note">{t("safari")}</p>}
          </div>
          <button type="button" className="lab-btn lab-btn-secondary" onClick={dismiss}>
            {t("dismiss")}
          </button>
        </div>
      )}
    </div>
  );
}
