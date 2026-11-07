"use client";

import { useTranslations } from "next-intl";
import { INTRO_REPLAY_EVENT } from "@/lib/home/intro/introGate";

/** Under the hero's buttons: plays the 45-board intro again. The intro layer listens for the event. */
export function IntroReplayLink() {
  const t = useTranslations("home.lab.intro");
  return (
    <p className="lab-intro-replay">
      <button type="button" onClick={() => window.dispatchEvent(new Event(INTRO_REPLAY_EVENT))}>
        <span aria-hidden="true">▶</span> {t("replay")}
      </button>
    </p>
  );
}
