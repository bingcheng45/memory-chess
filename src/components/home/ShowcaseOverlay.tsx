"use client";

import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import type { SquareName } from "@/lib/game/board";
import type { Group, Relation } from "@/lib/home/relations";
import { groupBounds, SHOWCASE, type GroupId, type ShowcaseMove } from "@/lib/home/showcase";
import type { Inspection, ShowcaseView } from "@/lib/home/showcaseView";
import { placeLabel, segmentBetween, squaresBox, type Segment } from "@/lib/home/labelPlacement";
import { BoardArrow } from "./BoardArrow";
import { fileOf, rowOf, squareCenter } from "./boardUnits";

const BOX_INSET = 0.06;
const BADGE_NUDGE = 0.02;
const SQUARE_INSET = 0.06;
const PILL_FONT = 0.26;
const PILL_HEIGHT = 0.36;
// Geist Mono advances about 0.6em per character.
const pillWidth = (label: string) => 0.3 + label.length * PILL_FONT * 0.6;

const CROSS_REACH = 0.22;
const MOVE_DOT_RADIUS = 0.12;
const GUARD_RADIUS = 0.4;
const TICK_SIZE = 0.2;

/** How an arrow is drawn: what a relation means, or a move a piece made. */
type ArrowKind = Relation["kind"] | "move";
interface DrawnArrow extends ShowcaseMove {
  readonly kind: ArrowKind;
}
/** A square a piece merely covers is drawn thin and without a head. */
const HEADLESS: ReadonlySet<ArrowKind> = new Set(["controls"]);

interface GroupCircleProps {
  group: Group<GroupId>;
  label: string;
  on: boolean;
  active: boolean;
  /** Squares with a piece on them: the name pill keeps clear of these. */
  occupied: ReadonlySet<SquareName>;
  /** The step's arrows: the name pill keeps clear of these too, after the pieces. */
  arrows: readonly Segment[];
  /** The outline is drawn under the marks; the name pill over them, so an arrow never crosses its text. */
  part: "outline" | "pill";
}

function GroupCircle({ group, label, on, active, occupied, arrows, part }: GroupCircleProps) {
  const [from, to] = groupBounds(group);
  const x = fileOf(from) + BOX_INSET;
  const y = rowOf(to) + BOX_INSET;
  const width = fileOf(to) - fileOf(from) + 1 - 2 * BOX_INSET;
  const height = rowOf(from) - rowOf(to) + 1 - 2 * BOX_INSET;
  const index = SHOWCASE.groups.indexOf(group) + 1;
  const pill = placeLabel(squaresBox(group.squares), { width: pillWidth(label), height: PILL_HEIGHT }, occupied, arrows);

  return (
    <g className="lab-sc-group" data-side={group.side} data-on={on || undefined} data-active={active || undefined}>
      {part === "outline" ? (
        <>
          <rect className="lab-sc-box" x={x} y={y} width={width} height={height} rx=".2" pathLength={1} />
          <g className="lab-sc-badge">
            <circle cx={x + BADGE_NUDGE} cy={y + BADGE_NUDGE} r=".17" />
            <text x={x + BADGE_NUDGE} y={y + 0.095} fontSize=".22" textAnchor="middle">
              {index}
            </text>
          </g>
        </>
      ) : (
        <g className="lab-sc-pill">
          <rect x={pill.x} y={pill.y} width={pill.width} height={pill.height} rx=".08" />
          <text x={pill.x + 0.14} y={pill.y + 0.26} fontSize={PILL_FONT}>
            {label}
          </text>
        </g>
      )}
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

function Arrow({ arrow, order }: { arrow: DrawnArrow; order: number }) {
  return (
    <BoardArrow
      from={arrow.from}
      to={arrow.to}
      kind={arrow.kind}
      headless={HEADLESS.has(arrow.kind)}
      className="lab-sc-arrow"
      style={{ "--order": order } as CSSProperties}
    />
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

/** A check mark in the square's upper-right corner: the rebuild confirmed this piece. */
function Tick({ square }: { square: SquareName }) {
  const cx = fileOf(square) + 1 - SQUARE_INSET - TICK_SIZE;
  const cy = rowOf(square) + SQUARE_INSET + TICK_SIZE;
  const s = TICK_SIZE * 0.5;
  return (
    <g className="lab-sc-tick">
      <circle cx={cx} cy={cy} r={TICK_SIZE} />
      <polyline points={`${cx - s},${cy} ${cx - s * 0.2},${cy + s * 0.75} ${cx + s},${cy - s * 0.7}`} />
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
  const occupied = new Set(
    Object.entries(view.board.placements)
      .filter(([home]) => !view.board.gone.includes(home as SquareName))
      .map(([, square]) => square as SquareName),
  );
  const arrows: DrawnArrow[] = [
    ...annotations.moves.map((move) => ({ ...move, kind: "move" as const })),
    ...annotations.relations,
  ];
  const segments = arrows.map((arrow) => segmentBetween(arrow.from, arrow.to));
  const circles = (part: GroupCircleProps["part"]) =>
    SHOWCASE.groups.map((group) => (
      <GroupCircle
        key={group.id}
        group={group}
        label={t(group.id)}
        on={view.circles.includes(group.id)}
        active={view.active === group.id}
        occupied={occupied}
        arrows={segments}
        part={part}
      />
    ));

  return (
    <svg className="lab-sc-ov" viewBox="0 0 8 8" aria-hidden="true">
      {circles("outline")}
      <g key={view.key}>
        {annotations.focus && <SquareMark square={annotations.focus} kind="source" />}
        {annotations.rings.map((ring) => (
          <SquareMark key={ring.square} square={ring.square} kind={ring.kind} />
        ))}
        {annotations.crosses.map((square) => (
          <Cross key={square} square={square} />
        ))}
        {arrows.map((arrow, order) => (
          <Arrow key={`${arrow.kind}-${arrow.from}-${arrow.to}`} arrow={arrow} order={order} />
        ))}
        {annotations.ticks.map((square) => (
          <Tick key={square} square={square} />
        ))}
        {inspection && <ReachMarks inspection={inspection} />}
      </g>
      {circles("pill")}
    </svg>
  );
}
