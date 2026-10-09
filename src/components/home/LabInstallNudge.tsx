"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { INSTALL_NUDGE_KEY, parseNudgeSeen, showsInstallNudge } from "@/lib/lab/installNudge";
import { choiceStore } from "./labChoices";
import { useFirstSight } from "./useFirstSight";
import { useIsSafari } from "./useIsSafari";

const nudgeSeen = choiceStore<number>(INSTALL_NUDGE_KEY, parseNudgeSeen);
const markSeen = () => nudgeSeen.update((current) => current ?? Date.now());

/** A Home Screen app already keeps its own record, so it is never asked to install itself. */
function useInstalled(): boolean | null {
  const [installed, setInstalled] = useState<boolean | null>(null);
  useEffect(() => {
    const standalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(standalone || window.matchMedia?.("(display-mode: standalone)")?.matches === true);
  }, []);
  return installed;
}

export function LabInstallNudge({ days }: { days: number }) {
  const t = useTranslations("home.lab.record.tools.nudge");
  const seenAt = nudgeSeen.useValue();
  const installed = useInstalled();
  const isSafari = useIsSafari();
  const [seenHere, setSeenHere] = useState(false);
  const onSight = useCallback(() => {
    setSeenHere(true);
    markSeen();
  }, []);
  const ref = useFirstSight<HTMLDivElement>(onSight);

  if (!showsInstallNudge({ days, installed, seenAt, seenHere })) return null;

  const dismiss = () => {
    setSeenHere(false);
    markSeen();
  };

  return (
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
  );
}
