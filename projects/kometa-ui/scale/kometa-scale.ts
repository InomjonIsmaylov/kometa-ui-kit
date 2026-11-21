/**
 * Chart maths behind the kit's charts (`k-spark`, `k-donut`, `k-bars`, `k-chart`, `k-gauge`, `k-heat`): plain functions,
 * no DOM, so an app can draw its own chart in the same style. Paths are rounded to two decimals to keep markup short.
 */

/** A point in viewBox units, y running down as in SVG. */
export type KometaPoint = readonly [number, number];

/** The chart palette: five categorical colours that read in both schemes. Series without a colour take these in turn. */
export const KOMETA_CHART_COLORS: readonly string[] = ['var(--viz-1)', 'var(--viz-2)', 'var(--viz-3)', 'var(--viz-4)', 'var(--viz-5)'];

/** The `i`th palette colour, wrapping round. */
export function chartColor(i: number): string {
  const n = KOMETA_CHART_COLORS.length;
  return KOMETA_CHART_COLORS[((i % n) + n) % n];
}

/** Maps `[d0, d1]` onto `[r0, r1]` linearly; a flat domain maps everything to `r0`. */
export function scale(d0: number, d1: number, r0: number, r1: number): (v: number) => number {
  const k = d1 === d0 ? 0 : (r1 - r0) / (d1 - d0);
  return (v) => r0 + (v - d0) * k;
}

/** A round axis top at or above `v`: 26.2 → 30, 4 350 000 → 5 000 000, 13 → 15 (1 when there is nothing to show). */
export function niceMax(v: number): number {
  if (!(v > 0)) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  return ([1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((m) => m * p >= v * (1 - 1e-9)) ?? 10) * p;
}

/** A range that starts and ends on round steps around `lo`–`hi`, and the gridline values in it (about `count` steps). */
export function niceScale(lo: number, hi: number, count = 4): { min: number; max: number; ticks: number[] } {
  if (!(hi > lo)) hi = lo + 1;
  const raw = (hi - lo) / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw * (1 - 1e-9)) ?? 10 * mag;
  const min = Math.floor(lo / step + 1e-9) * step;
  const max = Math.ceil(hi / step - 1e-9) * step;
  const ticks: number[] = [];
  for (let t = min; t <= max + step / 2; t += step) ticks.push(Math.round(t * 1e6) / 1e6);
  return { min: Math.round(min * 1e6) / 1e6, max: Math.round(max * 1e6) / 1e6, ticks };
}

/** `count + 1` evenly spaced values from `min` to `max`. */
export function ticks(min: number, max: number, count = 4): number[] {
  return Array.from({ length: count + 1 }, (_, i) => min + ((max - min) * i) / count);
}

/** Evenly spaced points for `values` across `[0, width]`: `max` at the top (y = 0), `min` at `height`. A lone value sits mid-way. */
export function spread(values: readonly number[], width: number, height: number, min = Math.min(0, ...values), max = Math.max(...values)): KometaPoint[] {
  const x = values.length > 1 ? scale(0, values.length - 1, 0, width) : () => width / 2;
  const y = scale(min, max, height, 0);
  return values.map((v, i) => [x(i), y(v)]);
}

const r = (n: number) => Math.round(n * 100) / 100;

/** An SVG path through the points: `M x y L x y …`. */
export function linePath(pts: readonly KometaPoint[]): string {
  return pts.map(([x, y], i) => `${i ? 'L' : 'M'}${r(x)} ${r(y)}`).join('');
}

/** The closed shape under a line: down to the y of `floor` when it is a number, or back along `floor` when it is a line. */
export function areaPath(top: readonly KometaPoint[], floor: number | readonly KometaPoint[]): string {
  if (!top.length) return '';
  const back: readonly KometaPoint[] = typeof floor === 'number'
    ? [[top[top.length - 1][0], floor], [top[0][0], floor]]
    : [...floor].reverse();
  return `${linePath(top)}${back.map(([x, y]) => `L${r(x)} ${r(y)}`).join('')}Z`;
}

/** Stacks layers bottom-up: each layer's floor is the top of the one below it. */
export function stack(layers: readonly (readonly number[])[]): { top: number[]; floor: number[] }[] {
  let floor = (layers[0] ?? []).map(() => 0);
  return layers.map((values) => {
    const top = values.map((v, i) => (floor[i] ?? 0) + v);
    const layer = { top, floor };
    floor = top;
    return layer;
  });
}

/**
 * Donut segments on a circle with `pathLength="100"`: where each starts and how long it is, in percent of the whole.
 * `gap` (percent) is taken off each segment so a sliver of surface separates neighbours. Negative values count as 0.
 */
export function arcs(values: readonly number[], gap = 0): { start: number; size: number; share: number }[] {
  const total = values.reduce((s, v) => s + Math.max(0, v), 0);
  let at = 0;
  return values.map((v) => {
    const share = total ? (Math.max(0, v) / total) * 100 : 0;
    const seg = { start: r(at), size: r(share > gap ? share - gap : share), share };
    at += share;
    return seg;
  });
}

/** The point on a circle at `deg` degrees clockwise from twelve o'clock. */
export function polar(cx: number, cy: number, radius: number, deg: number): KometaPoint {
  const a = ((deg - 90) * Math.PI) / 180;
  return [cx + radius * Math.cos(a), cy + radius * Math.sin(a)];
}

/** Which of `count` axis labels to show so no more than about `most` appear; the first and the last always show. */
export function sparseLabels(count: number, most = 6): Set<number> {
  const every = Math.max(1, Math.ceil(count / most));
  const shown = new Set<number>();
  for (let i = 0; i < count; i += every) shown.add(i);
  const lastShown = Math.floor((count - 1) / every) * every;
  if (count && lastShown !== count - 1) {
    // The last label replaces a neighbour that would touch it.
    if (count - 1 - lastShown < every / 2 && lastShown > 0) shown.delete(lastShown);
    shown.add(count - 1);
  }
  return shown;
}

/**
 * Splits `total` into whole numbers in proportion to `weights` that add up to exactly `total` (largest remainder),
 * so the parts printed in a chart always sum to the figure beside it.
 */
export function distribute(total: number, weights: readonly number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (!sum) return weights.map(() => 0);
  const raw = weights.map((w) => (w / sum) * total);
  const out = raw.map(Math.floor);
  const order = raw.map((x, i) => [x - Math.floor(x), i] as const).sort((a, b) => b[0] - a[0]);
  const left = total - out.reduce((a, b) => a + b, 0);
  for (let k = 0; k < left; k++) out[order[k % order.length][1]]++;
  return out;
}

/** Short axis numbers: 1 200 000 → "1.2M", 3 500 → "3.5K", 12 → "12". The default `format` of the kit's charts. */
export function compactNumber(v: number, locale = 'en'): string {
  return new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(v);
}
