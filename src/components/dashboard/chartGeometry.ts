export type Point = readonly [number, number];

const num = (value: number) => String(Math.round(value * 100) / 100);
const at = ([x, y]: Point) => `${num(x)},${num(y)}`;

/**
 * Fritsch-Carlson tangents: zero where the slope changes sign, scaled down where they would overshoot, so the curve never
 * swings past a point and a round's value never looks higher or lower than it was.
 */
function tangents(points: readonly Point[]): number[] {
  const slopes = points.slice(1).map(([x, y], index) => (y - points[index][1]) / (x - points[index][0]));
  const result = points.map((_, index) => {
    if (index === 0) return slopes[0] ?? 0;
    if (index === points.length - 1) return slopes[index - 1];
    const [before, after] = [slopes[index - 1], slopes[index]];
    return before * after <= 0 ? 0 : (before + after) / 2;
  });
  slopes.forEach((slope, index) => {
    if (slope === 0) {
      result[index] = 0;
      result[index + 1] = 0;
      return;
    }
    const [a, b] = [result[index] / slope, result[index + 1] / slope];
    const length = Math.hypot(a, b);
    if (length > 3) {
      result[index] = (3 / length) * a * slope;
      result[index + 1] = (3 / length) * b * slope;
    }
  });
  return result;
}

/** A smooth line through every point that stays monotone between neighbours. A single point is a bare move. */
export function monotonePath(points: readonly Point[]): string {
  if (points.length === 0) return "";
  const slope = tangents(points);
  const segments = points.slice(1).map((end, index) => {
    const start = points[index];
    const third = (end[0] - start[0]) / 3;
    return `C${at([start[0] + third, start[1] + slope[index] * third])} ${at([end[0] - third, end[1] - slope[index + 1] * third])} ${at(end)}`;
  });
  return [`M${at(points[0])}`, ...segments].join(" ");
}

const STEPS = [1, 2, 2.5, 5, 10];

/** Round tick values about `count` apart, and the domain padded out to the outer ticks. A flat range opens by 1% each way. */
export function niceTicks(low: number, high: number, count: number): { readonly ticks: number[]; readonly domain: readonly [number, number] } {
  const pad = high === low ? Math.max(1, Math.abs(low) * 0.01) : 0;
  const [from, to] = [low - pad, high + pad];
  const rough = (to - from) / Math.max(1, count - 1);
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = (STEPS.find((candidate) => candidate * magnitude >= rough) ?? 10) * magnitude;
  const [first, last] = [Math.floor(from / step) * step, Math.ceil(to / step) * step];
  const ticks = Array.from({ length: Math.round((last - first) / step) + 1 }, (_, index) => Number((first + index * step).toPrecision(12)));
  return { ticks, domain: [ticks[0], ticks[ticks.length - 1]] };
}
