"use client";

const PLOT = { width: 290, height: 110, pad: 8, left: 28 };

interface AxisProps {
  readonly label: string;
  readonly first: string;
  readonly last: string;
}

function yScale(values: readonly number[]) {
  const low = Math.max(0, Math.floor(Math.min(...values)) - 1);
  const high = Math.ceil(Math.max(...values)) + 1;
  const y = (value: number) => PLOT.height - ((value - low) / (high - low)) * (PLOT.height - 14);
  return { low, high, y };
}

function Guides({ values, y }: { values: readonly number[]; y: (value: number) => number }) {
  return values.map((value) => (
    <g key={value}>
      <line className="lab-c-grid" x1={PLOT.left} x2={PLOT.width - PLOT.pad} y1={y(value)} y2={y(value)} />
      <text x={PLOT.left - 6} y={y(value) + 4} textAnchor="end">
        {value}
      </text>
    </g>
  ));
}

function Ends({ first, last }: Pick<AxisProps, "first" | "last">) {
  return (
    <>
      <text x={PLOT.left} y={PLOT.height + 22}>
        {first}
      </text>
      <text x={PLOT.width - PLOT.pad} y={PLOT.height + 22} textAnchor="end">
        {last}
      </text>
    </>
  );
}

export const oneDecimal = (value: number) => (Math.round(value * 10) / 10).toFixed(1);

interface ValueLineProps extends AxisProps {
  readonly points: readonly number[];
  /** How many points at the start are drawn dashed, as weaker readings. */
  readonly partial?: number;
}

export function ValueLine({ points, partial = 0, label, first, last }: ValueLineProps) {
  const { low, high, y } = yScale(points);
  const x = (index: number) => PLOT.left + ((PLOT.width - PLOT.pad - PLOT.left) * index) / Math.max(1, points.length - 1);
  const coords = points.map((value, index) => `${x(index).toFixed(1)},${y(value).toFixed(1)}`);
  const latest = points[points.length - 1];
  // The dashed run ends on the first full point, so the two lines meet.
  const split = Math.min(partial, points.length - 1);

  return (
    <svg className="lab-chart" viewBox="0 0 300 140" role="img" aria-label={label}>
      <Guides values={[low, high]} y={y} />
      {partial > 0 && <polyline className="lab-c-partial" points={coords.slice(0, split + 1).join(" ")} />}
      {split < points.length - 1 && <polyline className="lab-c-line" points={coords.slice(split).join(" ")} />}
      <circle className="lab-c-last" cx={x(points.length - 1)} cy={y(latest)} r={4.5} />
      <text className="lab-c-last-label" x={x(points.length - 1) - 8} y={y(latest) - 10} textAnchor="end">
        {oneDecimal(latest)}
      </text>
      <Ends first={first} last={last} />
    </svg>
  );
}

/** Each step holds the span reached after a session, so the line only climbs or stays level. */
export function SpanStaircase({ steps, label, first, last }: AxisProps & { readonly steps: readonly number[] }) {
  const { y } = yScale(steps);
  const x = (index: number) => PLOT.left + ((PLOT.width - PLOT.pad - PLOT.left) * index) / steps.length;
  const rises = steps.map((value, index) => `${index === 0 ? "" : `V${y(value).toFixed(1)}`}H${x(index + 1).toFixed(1)}`);
  const path = `M${x(0).toFixed(1)} ${y(steps[0]).toFixed(1)}${rises.join("")}`;
  const lowest = steps[0];
  const highest = steps[steps.length - 1];

  return (
    <svg className="lab-chart" viewBox="0 0 300 140" role="img" aria-label={label}>
      <Guides values={[...new Set([lowest, highest])]} y={y} />
      <path className="lab-c-line" d={path} />
      <circle className="lab-c-last" cx={x(steps.length)} cy={y(highest)} r={4.5} />
      <Ends first={first} last={last} />
    </svg>
  );
}
