"use client";

import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import type { SquareName } from "@/lib/game/board";
import { SHOWCASE, type ShowcaseArrow, type ShowcaseGroup } from "@/lib/home/showcase";
import type { Inspection, ShowcaseView } from "@/lib/home/showcaseView";
import { fileOf, rowOf, squareCenter } from "./boardUnits";

const BOX_INSET = 0.06;
const BADGE_NUDGE = 0.02;
const SQUARE_INSET = 0.06;
const PILL_FONT = 0.26;
const PILL_HEIGHT = 0.36;
const PILL_GAP = 0.06;
// Geist Mono advances about 0.6em per character.
const pillWidth = (label: string) => 0.3 + label.length * PILL_FONT * 0.6;

const ARROW_TAIL = 0.28;
const ARROW_GAP = 0.3;
const HEAD_LENGTH = 0.24;
const HEAD_HALF_WIDTH = 0.15;
const CROSS_REACH = 0.22;
const MOVE_DOT_RADIUS = 0.12;
const GUARD_RADIUS = 0.4;

function GroupCircle({ group, label, on, active }: { group: ShowcaseGroup; label: string; on: boolean; active: boolean }) {
  const [from, to] = group.box;
  const x = fileOf(from) + BOX_INSET;
  const y = rowOf(to) + BOX_INSET;
  const width = fileOf(to) - fileOf(from) + 1 - 2 * BOX_INSET;
  const height = rowOf(from) - rowOf(to) + 1 - 2 * BOX_INSET;
  const index = SHOWCASE.groups.indexOf(group) + 1;
  const pill = {
    width: pillWidth(label),
    x: Math.min(x, 8 - pillWidth(label) - PILL_GAP),
    y: y >= PILL_HEIGHT + PILL_GAP ? y - PILL_HEIGHT - PILL_GAP : y + height + PILL_GAP,
  };

  return (
    <g className="lab-sc-group" data-side={group.side} data-on={on || undefined} data-active={active || undefined}>
      <rect className="lab-sc-box" x={x} y={y} width={width} height={height} rx=".2" pathLength={1} />
      <g className="lab-sc-badge">
        <circle cx={x + BADGE_NUDGE} cy={y + BADGE_NUDGE} r=".17" />
        <text x={x + BADGE_NUDGE} y={y + 0.095} fontSize=".22" textAnchor="middle">
          {index}
        </text>
      </g>
      <g className="lab-sc-pill">
        <rect x={pill.x} y={pill.y} width={pill.width} height={PILL_HEIGHT} rx=".08" />
        <text x={pill.x + 0.14} y={pill.y + 0.26} fontSize={PILL_FONT}>
          {label}
        </text>
      </g>
    </g>
  );
}

function SquareMark({ square, kind }: { square: SquareName; kind: string }) {
  return (
    <rect
      className="lab-sc-ring"
      data-kind={kind}
      x={fileOf(square) + SQUARE_INSET}
      y={rowOf(square) + SQUARE_INSET}
      width={1 - 2 * SQUARE_INSET}
      height={1 - 2 * SQUARE_INSET}
      rx=".12"
    />
  );
}

function Arrow({ arrow, order }: { arrow: ShowcaseArrow; order: number }) {
  const a = squareCenter(arrow.from);
  const z = squareCenter(arrow.to);
  const length = Math.hypot(z.x - a.x, z.y - a.y);
  const ux = (z.x - a.x) / length;
  const uy = (z.y - a.y) / length;
  const tip = { x: z.x - ux * ARROW_GAP, y: z.y - uy * ARROW_GAP };
  const end = arrow.faint ? tip : { x: tip.x - ux * 0.18, y: tip.y - uy * 0.18 };
  const base = { x: tip.x - ux * HEAD_LENGTH, y: tip.y - uy * HEAD_LENGTH };
  const head = [
    `${tip.x},${tip.y}`,
    `${base.x - uy * HEAD_HALF_WIDTH},${base.y + ux * HEAD_HALF_WIDTH}`,
    `${base.x + uy * HEAD_HALF_WIDTH},${base.y - ux * HEAD_HALF_WIDTH}`,
  ].join(" ");

  return (
    <g className="lab-sc-arrow" data-faint={arrow.faint || undefined} style={{ "--order": order } as CSSProperties}>
      <line x1={a.x + ux * ARROW_TAIL} y1={a.y + uy * ARROW_TAIL} x2={end.x} y2={end.y} pathLength={1} />
      {!arrow.faint && <polygon points={head} />}
    </g>
  );
}

function Cross({ square }: { square: SquareName }) {
  const { x, y } = squareCenter(square);
  return (
    <g className="lab-sc-cross">
      <line x1={x - CROSS_REACH} y1={y - CROSS_REACH} x2={x + CROSS_REACH} y2={y + CROSS_REACH} />
      <line x1={x - CROSS_REACH} y1={y + CROSS_REACH} x2={x + CROSS_REACH} y2={y - CROSS_REACH} />
    </g>
  );
}

function ReachMarks({ inspection }: { inspection: Inspection }) {
  return (
    <>
      {inspection.moves.map((square) => {
        const { x, y } = squareCenter(square);
        return <circle key={square} className="lab-sc-dot" cx={x} cy={y} r={MOVE_DOT_RADIUS} />;
      })}
      {inspection.captures.map((square) => (
        <SquareMark key={square} square={square} kind={inspection.color} />
      ))}
      {inspection.guards.map((square) => {
        const { x, y } = squareCenter(square);
        return <circle key={square} className="lab-sc-guard" cx={x} cy={y} r={GUARD_RADIUS} />;
      })}
    </>
  );
}

export function ShowcaseOverlay({ view }: { view: ShowcaseView }) {
  const t = useTranslations("home.lab.hero.showcase.groups");
  const { annotations, inspection } = view;

  return (
    <svg className="lab-sc-ov" viewBox="0 0 8 8" aria-hidden="true">
      {SHOWCASE.groups.map((group) => (
        <GroupCircle
          key={group.id}
          group={group}
          label={t(group.id)}
          on={view.circles.includes(group.id)}
          active={view.active === group.id}
        />
      ))}
      <g key={view.key}>
        {annotations.focus && <SquareMark square={annotations.focus} kind="source" />}
        {annotations.rings.map((ring) => (
          <SquareMark key={ring.square} square={ring.square} kind={ring.kind} />
        ))}
        {annotations.crosses.map((square) => (
          <Cross key={square} square={square} />
        ))}
        {annotations.arrows.map((arrow, order) => (
          <Arrow key={`${arrow.from}-${arrow.to}`} arrow={arrow} order={order} />
        ))}
        {inspection && <ReachMarks inspection={inspection} />}
      </g>
    </svg>
  );
}
