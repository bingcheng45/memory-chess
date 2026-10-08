"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Calls `onSight` once, the first time the element is on screen in a visible tab. A tab opened in the background
 * reports its elements as intersecting, so the observer alone would count a view nobody saw.
 */
export function useFirstSight<T extends Element>(onSight: () => void): (node: T | null) => void {
  const [node, setNode] = useState<T | null>(null);
  const latest = useRef(onSight);
  const seen = useRef(false);
  useEffect(() => {
    latest.current = onSight;
  });
  useEffect(() => {
    if (!node || seen.current || typeof IntersectionObserver === "undefined") return;
    let inView = false;
    const stop = () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", check);
    };
    const check = () => {
      if (seen.current || !inView || document.visibilityState !== "visible") return;
      seen.current = true;
      stop();
      latest.current();
    };
    const observer = new IntersectionObserver((entries) => {
      inView = entries.some(({ isIntersecting }) => isIntersecting);
      check();
    });
    observer.observe(node);
    document.addEventListener("visibilitychange", check);
    return stop;
  }, [node]);
  return setNode;
}
