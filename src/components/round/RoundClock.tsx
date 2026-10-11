"use client";

import { useEffect, useRef, type RefObject } from "react";
import { formatSecondsMs } from "@/utils/timer";

export type ClockFace =
  | { readonly kind: "still"; readonly text: string }
  | { readonly kind: "countdown"; readonly startedAt: number; readonly totalMs: number }
  | { readonly kind: "countup"; readonly startedAt: number };

const seconds = (ms: number) => `${formatSecondsMs(ms)}s`;

function initialText(face: ClockFace): string {
  switch (face.kind) {
    case "still":
      return face.text;
    case "countdown":
      return seconds(face.totalMs);
    case "countup":
      return seconds(0);
  }
}

interface RoundClockProps {
  face: ClockFace;
  meterRef: RefObject<HTMLElement | null>;
}

/**
 * Writes its text and the meter width straight into the DOM on every frame, so
 * a clock that ticks at display rate never re-renders the round it sits in.
 */
export function RoundClock({ face, meterRef }: RoundClockProps) {
  const textRef = useRef<HTMLSpanElement>(null);
  const kind = face.kind;
  const startedAt = face.kind === "still" ? 0 : face.startedAt;
  const totalMs = face.kind === "countdown" ? face.totalMs : 0;

  useEffect(() => {
    const text = textRef.current;
    const meter = meterRef.current;
    if (!text || kind === "still") return;
    let frame = 0;
    const draw = () => {
      const elapsed = performance.now() - startedAt;
      if (kind === "countdown") {
        const left = Math.max(0, totalMs - elapsed);
        text.textContent = seconds(left);
        if (meter) meter.style.width = `${(left / totalMs) * 100}%`;
        if (left === 0) return;
      } else {
        text.textContent = seconds(elapsed);
      }
      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(frame);
      if (meter) meter.style.width = "0%";
    };
  }, [kind, startedAt, totalMs, meterRef]);

  return (
    <span className="lab-mono" role="timer" ref={textRef}>
      {initialText(face)}
    </span>
  );
}
