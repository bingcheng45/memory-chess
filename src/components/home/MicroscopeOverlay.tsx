"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import type { MicroscopePhase } from "@/lib/home/specimen";

// Board units: the overlay's viewBox is the 8x8 board, one unit per square.
const FIXATIONS = [
  { cx: 3.5, cy: 1.5, r: 1.9, warm: true, pin: { x: 3.95, y: 0.95 } },
  { cx: 6.2, cy: 6.6, r: 2, warm: false, pin: { x: 6.95, y: 6 } },
  { cx: 2.5, cy: 4.5, r: 1.1, warm: false, pin: { x: 2.95, y: 4 } },
  { cx: 5.5, cy: 5.5, r: 1, warm: true, pin: { x: 5.95, y: 5.05 } },
];

const CHUNKS = [
  { id: "a", key: "chunkShield", box: { x: 4.92, y: 4.92, w: 3, h: 3 }, pill: { x: 4.95, y: 4.5 } },
  { id: "b", key: "chunkBattery", box: { x: 2.92, y: 0.08, w: 1.16, h: 2.84 }, pill: { x: 4.15, y: 0.1 } },
  { id: "c", key: "chunkLone", box: { x: 1.92, y: 3.92, w: 1.16, h: 1.16 }, pill: { x: 1.95, y: 5.15 } },
] as const;

const PILL_FONT = 0.24;
// Geist Mono advances about 0.6em per character.
const pillWidth = (label: string) => 0.2 + label.length * PILL_FONT * 0.6;

export function MicroscopeOverlay({ overlay }: { overlay: MicroscopePhase["overlay"] }) {
  const t = useTranslations("home.lab.method");
  const id = useId().replace(/:/g, "");

  return (
    <svg className="lab-ov" viewBox="0 0 8 8" aria-hidden="true">
      <defs>
        <radialGradient id={`${id}-cool`}>
          <stop offset="0" className="lab-ov-blue" stopOpacity=".55" />
          <stop offset="1" className="lab-ov-blue" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-warm`}>
          <stop offset="0" className="lab-ov-mark" stopOpacity=".6" />
          <stop offset="1" className="lab-ov-mark" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g data-on={overlay === "fixation" || undefined}>
        {FIXATIONS.map((spot) => (
          <circle key={`${spot.cx}-${spot.cy}`} cx={spot.cx} cy={spot.cy} r={spot.r} fill={`url(#${id}-${spot.warm ? "warm" : "cool"})`} />
        ))}
        {FIXATIONS.map(({ pin }, index) => (
          <g key={index}>
            <circle cx={pin.x} cy={pin.y} r=".2" className="lab-ov-pin" strokeWidth=".03" />
            <text x={pin.x} y={pin.y + 0.09} textAnchor="middle" fontSize=".28" className="lab-ov-pin-text">
              {index + 1}
            </text>
          </g>
        ))}
      </g>
      <g data-on={overlay === "chunks" || undefined}>
        {CHUNKS.map(({ id: chunk, key, box, pill }) => {
          const label = t(key);
          return (
            <g key={chunk}>
              <rect x={box.x} y={box.y} width={box.w} height={box.h} rx=".15" strokeWidth=".06" className={`lab-ov-box-${chunk}`} />
              <rect x={pill.x} y={pill.y} width={pillWidth(label)} height=".36" rx=".06" className={`lab-ov-pill-${chunk}`} />
              <text x={pill.x + 0.1} y={pill.y + 0.26} fontSize={PILL_FONT} className="lab-ov-pill-text">
                {label}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
