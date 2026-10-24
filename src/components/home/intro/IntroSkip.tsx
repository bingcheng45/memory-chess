"use client";

import { useEffect } from "react";
import { INTRO_MARK } from "@/lib/home/intro/introGate";

/** Removing the gate's mark is the whole of ending the intro: the CSS that shows the layer and locks the page keys on it. */
function endIntro() {
  document.querySelector(`script[${INTRO_MARK}]`)?.removeAttribute(INTRO_MARK);
}

export function IntroSkip({ label }: { readonly label: string }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") endIntro();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <button type="button" className="home-intro-skip" onClick={endIntro}>
      {label}
    </button>
  );
}
