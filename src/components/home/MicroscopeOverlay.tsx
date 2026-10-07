"use client";

import { useTranslations } from "next-intl";
import { FILES, RANKS, type SquareName } from "@/lib/game/board";
import type { MicroscopePhase } from "@/lib/home/specimen";

// Board units: the overlay's viewBox is the 8x8 board, one unit per square.
const squareCenter = (square: SquareName) => ({
  x: FILES.indexOf(square[0] as (typeof FILES)[number]) + 0.5,
  y: RANKS.indexOf(square[1] as (typeof RANKS)[number]) + 0.5,
});

/** Pieces of the specimen that touch, share a file, or sit together in the corner. */
const RELATIONS: readonly (readonly [SquareName, SquareName])[] = [
  ["d8", "d6"],
  ["f2", "g2"],
  ["g2", "h2"],
  ["g1", "g2"],
  ["f3", "g2"],
];

const CHUNKS = [
  { id: "a", key: "chunkCorner", box: { x: 4.92, y: 4.92, w: 3, h: 3 }, pill: { x: 4.95, y: 4.5 } },
  { id: "b", key: "chunkPair", box: { x: 2.92, y: 0.08, w: 1.16, h: 2.84 }, pill: { x: 4.15, y: 0.1 } },
  { id: "c", key: "chunkLone", box: { x: 1.92, y: 3.92, w: 1.16, h: 1.16 }, pill: { x: 1.95, y: 5.15 } },
] as const;

const PILL_FONT = 0.24;
// Geist Mono advances about 0.6em per character.
const pillWidth = (label: string) => 0.2 + label.length * PILL_FONT * 0.6;

function GroupBox({ chunk, label, dashed = false }: { chunk: (typeof CHUNKS)[number]; label: string; dashed?: boolean }) {
  const { id, box, pill } = chunk;
  return (
    <g>
      <rect
        x={box.x}
        y={box.y}
        width={box.w}
        height={box.h}
        rx=".15"
        strokeWidth=".06"
        className={`lab-ov-box-${id}${dashed ? " lab-ov-box-dashed" : ""}`}
      />
      <rect x={pill.x} y={pill.y} width={pillWidth(label)} height=".36" rx=".06" className={`lab-ov-pill-${id}`} />
      <text x={pill.x + 0.1} y={pill.y + 0.26} fontSize={PILL_FONT} className="lab-ov-pill-text">
        {label}
      </text>
    </g>
  );
}

export function MicroscopeOverlay({ overlay }: { overlay: MicroscopePhase["overlay"] }) {
  const t = useTranslations("home.lab.method");

  return (
    <svg className="lab-ov" viewBox="0 0 8 8" aria-hidden="true">
      <g data-on={overlay === "relations" || undefined}>
        {RELATIONS.map(([from, to]) => {
          const a = squareCenter(from);
          const b = squareCenter(to);
          return <line key={`${from}-${to}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="lab-ov-relation" />;
        })}
      </g>
      <g data-on={overlay === "chunks" || undefined}>
        {CHUNKS.map((chunk) => (
          <GroupBox key={chunk.id} chunk={chunk} label={t(chunk.key)} />
        ))}
      </g>
      <g data-on={overlay === "groupA" || undefined}>
        <GroupBox chunk={CHUNKS[0]} label={t("chunkGroupA")} dashed />
      </g>
    </svg>
  );
}
