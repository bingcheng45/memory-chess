"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import type { Tone } from "@/lib/lab/progressSeries";
import { monotonePath, type Point } from "./chartGeometry";
import "./progressChart.css";

export interface ChartTip {
  readonly value: string;
  readonly label: string;
}

export interface ProgressChartProps {
  /** Sets the plot box's fixed height, so the page does not move when the chart is measured and drawn. */
  readonly variant: "rating" | "panel";
  readonly tone: Tone;
  readonly line: readonly number[];
  /** Each round's own value, drawn faintly behind a smoothed line. */
  readonly dots?: readonly number[];
  readonly domain: readonly [number, number];
  readonly ticks: readonly { readonly value: number; readonly label: string }[];
  readonly xLabels: readonly [string, string];
  /** Ringed and labelled; at the last index its label stands in for `latestLabel`. */
  readonly best?: { readonly index: number; readonly value: number; readonly label: string };
  readonly latestLabel?: string;
  readonly reference?: { readonly value: number; readonly label: string };
  /** One per index, what the crosshair reads out there. */
  readonly tips: readonly ChartTip[];
  /** The names of the dots and the line, when the chart draws both. */
  readonly legend?: readonly [dots: string, line: string];
  readonly label: string;
  readonly table: { readonly head: readonly string[]; readonly rows: readonly (readonly string[])[] };
}

const PAD = { top: 22, right: 12, bottom: 26, left: 44 };
const LABEL_ROOM = 18;
/** Closer than this, the best's label would run into the latest's, so the ring alone marks it. */
const LABEL_GAP = 64;

interface Size {
  readonly width: number;
  readonly height: number;
}

function useSize() {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<Size | null>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize(width > 0 && height > 0 ? { width, height } : null);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return [ref, size] as const;
}

/** A label above its point, or under it when the top edge leaves no room. */
const labelY = (y: number) => (y - PAD.top < LABEL_ROOM ? y + LABEL_ROOM : y - 10);

function anchorAt(x: number, { width }: Size): "start" | "middle" | "end" {
  if (x < PAD.left + 32) return "start";
  if (x > width - PAD.right - 32) return "end";
  return "middle";
}

/** Rounds sit evenly across the plot, a lone round in its middle. */
const xAt = (index: number, last: number, width: number) => (last === 0 ? (PAD.left + width - PAD.right) / 2 : PAD.left + ((width - PAD.left - PAD.right) * index) / last);

const KEY_STEPS: { readonly [key: string]: (index: number, last: number) => number } = {
  ArrowLeft: (index) => Math.max(0, index - 1),
  ArrowRight: (index, last) => Math.min(last, index + 1),
  Home: () => 0,
  End: (_, last) => last,
};

function Plot({ size, props, active }: { size: Size; props: ProgressChartProps; active: number | null }) {
  const { line, dots, domain, ticks, xLabels, best, latestLabel, reference, label } = props;
  const gradient = `lab-pc-fill-${useId().replace(/[^\w-]/g, "")}`;
  const last = line.length - 1;
  const [left, right, top, bottom] = [PAD.left, size.width - PAD.right, PAD.top, size.height - PAD.bottom];
  const x = (index: number) => xAt(index, last, size.width);
  const y = (value: number) => bottom - ((bottom - top) * (value - domain[0])) / (domain[1] - domain[0]);
  const points = line.map((value, index): Point => [x(index), y(value)]);
  const path = monotonePath(points);
  const [latestX, latestY] = points[last];
  const bestIsLatest = best?.index === last;
  const bestRinged = best && !(bestIsLatest && best.value === line[last]);
  const bestLabelled = best && (bestIsLatest || !latestLabel || Math.abs(x(best.index) - latestX) >= LABEL_GAP);
  const referenceY = reference && y(reference.value);
  const referenceBelow = referenceY !== undefined && Math.abs(referenceY - latestY) < LABEL_ROOM + 4;

  return (
    <svg className="lab-pc-svg" viewBox={`0 0 ${size.width} ${size.height}`} width={size.width} height={size.height} role="img" aria-label={label}>
      <defs>
        <linearGradient id={gradient} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" className="lab-pc-fill-top" />
          <stop offset="1" className="lab-pc-fill-bottom" />
        </linearGradient>
      </defs>
      {ticks.map((tick) => (
        <g key={tick.value}>
          <line className="lab-pc-grid" x1={left} x2={right} y1={y(tick.value)} y2={y(tick.value)} />
          <text className="lab-pc-axis" x={left - 8} y={y(tick.value) + 4} textAnchor="end">
            {tick.label}
          </text>
        </g>
      ))}
      <text className="lab-pc-axis" x={left} y={size.height - 6} textAnchor="start">
        {xLabels[0]}
      </text>
      <text className="lab-pc-axis" x={right} y={size.height - 6} textAnchor="end">
        {xLabels[1]}
      </text>
      {reference && referenceY !== undefined && (
        <g>
          <line className="lab-pc-ref" x1={left} x2={right} y1={referenceY} y2={referenceY} />
          <text className="lab-pc-axis" x={right} y={referenceBelow ? referenceY + 14 : referenceY - 6} textAnchor="end">
            {reference.label}
          </text>
        </g>
      )}
      <g className="lab-pc-reveal">
        <path className="lab-pc-area" d={`${path} L${right},${bottom} L${left},${bottom} Z`} fill={`url(#${gradient})`} />
        {dots?.map((value, index) => <circle key={index} className="lab-pc-dot" cx={x(index)} cy={y(value)} r={3} />)}
        <path className="lab-pc-line" d={path} />
      </g>
      {active !== null && <line className="lab-pc-cross" x1={x(active)} x2={x(active)} y1={top} y2={bottom} />}
      {best && bestRinged && <circle className="lab-pc-best" cx={x(best.index)} cy={y(best.value)} r={4} />}
      <circle className="lab-pc-latest" cx={latestX} cy={latestY} r={5} />
      {active !== null && active !== last && <circle className="lab-pc-active" cx={points[active][0]} cy={points[active][1]} r={4} />}
      {best && bestLabelled && (
        <text className="lab-pc-mark" x={x(best.index)} y={labelY(y(best.value))} textAnchor={anchorAt(x(best.index), size)}>
          {best.label}
        </text>
      )}
      {latestLabel && !bestIsLatest && (
        <text className="lab-pc-mark" x={latestX} y={labelY(latestY)} textAnchor="end">
          {latestLabel}
        </text>
      )}
    </svg>
  );
}

/**
 * The dashboard's line over rounds: a smoothed line with its area, optional faint per-round dots, the best and the latest
 * marked, and a crosshair that pointer and arrow keys move. The SVG is drawn at the measured pixel size, so its text is
 * true size at any width; a hidden table carries every point for screen readers.
 */
export function ProgressChart(props: ProgressChartProps) {
  const { variant, tone, line, tips, legend, table } = props;
  const [ref, size] = useSize();
  const [active, setActive] = useState<number | null>(null);
  const last = line.length - 1;

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!size) return;
    const offset = event.clientX - event.currentTarget.getBoundingClientRect().left;
    const step = last === 0 ? 1 : (size.width - PAD.left - PAD.right) / last;
    setActive(Math.min(last, Math.max(0, Math.round((offset - PAD.left) / step))));
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") return setActive(null);
    const move = KEY_STEPS[event.key];
    if (!move) return;
    event.preventDefault();
    setActive(move(active ?? last, last));
  };
  const tip = active === null ? null : tips[active];
  const tipX = active === null || !size ? 0 : xAt(active, last, size.width);

  return (
    <div className="lab-pc" data-tone={tone === "better" ? "better" : "calm"}>
      <div
        ref={ref}
        className="lab-pc-plot"
        data-variant={variant}
        tabIndex={0}
        onPointerMove={onPointerMove}
        onPointerLeave={() => setActive(null)}
        onKeyDown={onKeyDown}
        onBlur={() => setActive(null)}
      >
        {size && <Plot size={size} props={props} active={active} />}
        <div className="lab-pc-tip" aria-live="polite" data-open={tip ? "" : undefined} style={{ left: tipX }} data-align={size ? anchorAt(tipX, size) : "middle"}>
          {tip && (
            <>
              <strong>{tip.value}</strong>
              <span>{tip.label}</span>
            </>
          )}
        </div>
      </div>
      {legend && (
        <ul className="lab-pc-legend">
          <li>
            <span className="lab-pc-key-dot" aria-hidden="true" />
            {legend[0]}
          </li>
          <li>
            <span className="lab-pc-key-line" aria-hidden="true" />
            {legend[1]}
          </li>
        </ul>
      )}
      <table className="lab-sr">
        <thead>
          <tr>
            {table.head.map((cell) => (
              <th key={cell} scope="col">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, column) => (
                <td key={column}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
