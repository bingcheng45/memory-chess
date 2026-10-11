"use client";

import { useTranslations } from "next-intl";
import type { SquareName } from "@/lib/game/board";
import type { Relation, RelationCheck } from "@/lib/home/relations";
import { SPECIMEN, SPECIMEN_GROUPS, SPECIMEN_RECALL, type MicroscopePhase } from "@/lib/home/specimen";
import { placeLabel, segmentBetween, squaresBox } from "@/lib/home/labelPlacement";
import { BoardArrow, direction } from "./BoardArrow";
import { fileOf, rowOf } from "./boardUnits";

const CELL_INSET = 0.05;
const RING_INSET = 0.07;
const PILL_FONT = 0.24;
const PILL_HEIGHT = 0.36;
// Geist Mono advances about 0.6em per character.
const pillWidth = (label: string) => 0.24 + label.length * PILL_FONT * 0.6;
const BAR_HALF = 0.32;
const VERDICT_RADIUS = 0.17;

/** The squares holding a piece in this phase, which a label must not cover. */
function occupiedIn(phase: MicroscopePhase): ReadonlySet<SquareName> {
  switch (phase.pieces) {
    case "none":
      return new Set();
    case "specimen":
      return new Set(Object.keys(SPECIMEN) as SquareName[]);
    case "recall":
      return new Set(Object.keys(SPECIMEN_RECALL) as SquareName[]);
  }
}

function GroupMarks({ phase }: { phase: MicroscopePhase }) {
  const t = useTranslations("home.lab.method.groups");
  const occupied = occupiedIn(phase);
  const arrows = [...phase.relations, ...phase.checks.map((check) => check.relation)]
    .filter((relation) => relation.kind !== "blocked")
    .map((relation) => segmentBetween(relation.from, relation.to));
  const shown = SPECIMEN_GROUPS.filter((group) => phase.groups.includes(group.id));

  return (
    <g className="lab-ov-groups">
      {shown.map((group) =>
        group.squares.map((square) => (
          <rect
            key={`${group.id}-${square}`}
            className="lab-ov-cell"
            data-group={group.id}
            x={fileOf(square) + CELL_INSET}
            y={rowOf(square) + CELL_INSET}
            width={1 - 2 * CELL_INSET}
            height={1 - 2 * CELL_INSET}
            rx=".12"
          />
        )),
      )}
      {phase.labels &&
        shown.map((group) => {
          const label = `${SPECIMEN_GROUPS.indexOf(group) + 1} · ${t(`${group.id}.name`)}`;
          const width = pillWidth(label);
          const { x, y } = placeLabel(squaresBox(group.squares), { width, height: PILL_HEIGHT }, occupied, arrows);
          return (
            <g key={group.id} className="lab-ov-pill" data-group={group.id}>
              <rect x={x} y={y} width={width} height={PILL_HEIGHT} rx=".08" />
              <text x={x + 0.12} y={y + 0.26} fontSize={PILL_FONT}>
                {label}
              </text>
            </g>
          );
        })}
    </g>
  );
}

/** Two pawns nose to nose: a bar across the border between their squares. */
function BlockBar({ from, to }: { from: SquareName; to: SquareName }) {
  const { ux, uy, mid } = direction(from, to);
  return (
    <g className="lab-ov-rel" data-kind="blocked">
      <line x1={mid.x - uy * BAR_HALF} y1={mid.y + ux * BAR_HALF} x2={mid.x + uy * BAR_HALF} y2={mid.y - ux * BAR_HALF} />
    </g>
  );
}

function RelationMark({ relation, verdict }: { relation: Relation; verdict?: boolean }) {
  if (relation.kind === "blocked") return <BlockBar from={relation.from} to={relation.to} />;
  return (
    <BoardArrow
      from={relation.from}
      to={relation.to}
      kind={relation.kind}
      headless={relation.kind === "chain" || relation.kind === "controls"}
      className={verdict === undefined ? "lab-ov-rel" : "lab-ov-rel lab-ov-checked"}
    />
  );
}

/** A tick or a cross at the middle of a re-derived relation. */
function Verdict({ check }: { check: RelationCheck }) {
  const { mid } = direction(check.relation.from, check.relation.to);
  const s = VERDICT_RADIUS * 0.5;
  return (
    <g className="lab-ov-verdict" data-holds={check.holds}>
      <circle cx={mid.x} cy={mid.y} r={VERDICT_RADIUS} />
      {check.holds ? (
        <polyline points={`${mid.x - s},${mid.y} ${mid.x - s * 0.2},${mid.y + s * 0.75} ${mid.x + s},${mid.y - s * 0.7}`} />
      ) : (
        <path d={`M${mid.x - s * 0.7},${mid.y - s * 0.7}L${mid.x + s * 0.7},${mid.y + s * 0.7}M${mid.x - s * 0.7},${mid.y + s * 0.7}L${mid.x + s * 0.7},${mid.y - s * 0.7}`} />
      )}
    </g>
  );
}

/** What the microscope draws over the board for one phase, all of it from the phase's data. */
export function MicroscopeOverlay({ phase }: { phase: MicroscopePhase }) {
  return (
    <svg className="lab-ov" viewBox="0 0 8 8" aria-hidden="true">
      <g key={phase.id}>
        <GroupMarks phase={phase} />
        {phase.focus.map((square) => (
          <rect
            key={square}
            className="lab-ov-ring"
            x={fileOf(square) + RING_INSET}
            y={rowOf(square) + RING_INSET}
            width={1 - 2 * RING_INSET}
            height={1 - 2 * RING_INSET}
            rx=".12"
          />
        ))}
        {phase.relations.map((relation) => (
          <RelationMark key={`${relation.kind}-${relation.from}-${relation.to}`} relation={relation} />
        ))}
        {phase.checks.map((check) => (
          <g key={`${check.relation.kind}-${check.relation.from}-${check.relation.to}`} data-holds={check.holds}>
            <RelationMark relation={check.relation} verdict={check.holds} />
            <Verdict check={check} />
          </g>
        ))}
      </g>
    </svg>
  );
}
