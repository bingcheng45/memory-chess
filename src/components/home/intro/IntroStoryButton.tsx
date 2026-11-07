"use client";

import { INTRO_REPLAY_EVENT } from "@/lib/home/intro/introGate";

/** The phone first screen's "Read Najdorf's story": plays the 45-board intro, as the hero's replay link does. */
export function IntroStoryButton({ label }: { readonly label: string }) {
  return (
    <button type="button" className="home-first-story" onClick={() => window.dispatchEvent(new Event(INTRO_REPLAY_EVENT))}>
      {label}
    </button>
  );
}
