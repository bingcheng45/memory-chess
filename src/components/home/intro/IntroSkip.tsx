"use client";

import { useEffect, useRef } from "react";
import { INTRO_MARK } from "@/lib/home/intro/introGate";

/** The same 12 seconds as the failsafe in intro.css, which hides the layer without script. */
const FAILSAFE_MS = 12_000;

/** Everything beside the layer or beside one of its ancestors: the page the layer covers. */
function coveredBy(layer: Element): Element[] {
  const covered: Element[] = [];
  for (let node = layer; node !== document.body && node.parentElement; node = node.parentElement) {
    for (const sibling of node.parentElement.children) {
      if (sibling !== node && !sibling.hasAttribute("inert")) covered.push(sibling);
    }
  }
  return covered;
}

/**
 * While the intro plays, Skip holds focus and the page under the layer is inert, so Tab cannot reach links the layer
 * hides. Removing the gate's mark ends the intro: the CSS that shows the layer and locks scrolling keys on it.
 */
export function IntroSkip({ label }: { readonly label: string }) {
  const button = useRef<HTMLButtonElement>(null);
  const end = useRef(() => {});

  useEffect(() => {
    const gate = document.querySelector(`script[${INTRO_MARK}]`);
    const layer = button.current?.closest(".home-intro");
    if (!gate || !layer) return;

    const covered = coveredBy(layer);
    covered.forEach((element) => element.setAttribute("inert", ""));
    button.current?.focus({ preventScroll: true });

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") end.current();
    };
    const failsafe = window.setTimeout(() => end.current(), Math.max(0, FAILSAFE_MS - performance.now()));
    const release = () => {
      covered.forEach((element) => element.removeAttribute("inert"));
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(failsafe);
    };
    end.current = () => {
      gate.removeAttribute(INTRO_MARK);
      release();
    };
    window.addEventListener("keydown", onKey);
    return release;
  }, []);

  return (
    <button ref={button} type="button" className="home-intro-skip" onClick={() => end.current()}>
      {label}
    </button>
  );
}
