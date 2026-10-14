"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "./useLabEffects";

interface Timed {
  readonly durationMs: number;
}

/**
 * Walks through `steps`, one timer per step. Autoplay runs only while the card
 * is on screen and nothing holds it, and never starts under reduced motion;
 * Play still starts it there, since the visitor asked.
 */
export function useShowcaseClock(steps: readonly Timed[], hold: boolean) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [visible, setVisible] = useState(false);
  const count = steps.length;

  useEffect(() => {
    if (reduced) setPlaying(false);
  }, [reduced]);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const running = playing && visible && !hold;
  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(() => setIndex((current) => (current + 1) % count), steps[index].durationMs);
    return () => window.clearTimeout(timer);
  }, [running, index, count, steps]);

  const go = useCallback((target: number) => setIndex(((target % count) + count) % count), [count]);
  const play = useCallback(() => setPlaying(true), []);
  const toggle = useCallback(() => setPlaying((current) => !current), []);

  return { ref, index, playing, go, play, toggle };
}
