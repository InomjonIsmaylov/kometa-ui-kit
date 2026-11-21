import { arcs, areaPath, chartColor, compactNumber, distribute, linePath, niceMax, niceScale, polar, scale, sparseLabels, spread, stack } from './kometa-scale';

describe('kometa-ui/scale', () => {
  it('maps a domain onto a range, and a flat domain onto its start', () => {
    expect(scale(0, 10, 0, 100)(5)).toBe(50);
    expect(scale(0, 10, 100, 0)(10)).toBe(0);
    expect(scale(3, 3, 7, 9)(3)).toBe(7);
  });

  it('rounds an axis top up to a round step', () => {
    expect(niceMax(26.2)).toBe(30);
    expect(niceMax(4_350_000)).toBe(5_000_000);
    expect(niceMax(13)).toBe(15);
    expect(niceMax(100)).toBe(100);
    expect(niceMax(0)).toBe(1);
    expect(niceMax(NaN)).toBe(1);
  });

  it('builds a round scale with ticks covering the data', () => {
    expect(niceScale(0, 17)).toEqual({ min: 0, max: 20, ticks: [0, 5, 10, 15, 20] });
    const s = niceScale(36.4, 38.9);
    expect(s.min).toBeLessThanOrEqual(36.4);
    expect(s.max).toBeGreaterThanOrEqual(38.9);
    expect(s.ticks[0]).toBe(s.min);
    expect(s.ticks.at(-1)).toBe(s.max);
    expect(niceScale(5, 5).max).toBeGreaterThan(5);
  });

  it('spreads values across a box, max at the top', () => {
    expect(spread([0, 5, 10], 100, 50)).toEqual([[0, 50], [50, 25], [100, 0]]);
    expect(spread([4], 100, 50, 0, 8)).toEqual([[50, 25]]);
  });

  it('draws line and area paths', () => {
    expect(linePath([[0, 10], [5.555, 0]])).toBe('M0 10L5.56 0');
    expect(areaPath([[0, 10], [10, 0]], 20)).toBe('M0 10L10 0L10 20L0 20Z');
    expect(areaPath([[0, 1], [10, 2]], [[0, 5], [10, 6]])).toBe('M0 1L10 2L10 6L0 5Z');
    expect(areaPath([], 0)).toBe('');
  });

  it('stacks layers bottom-up', () => {
    expect(stack([[1, 2], [3, 4]])).toEqual([{ top: [1, 2], floor: [0, 0] }, { top: [4, 6], floor: [1, 2] }]);
  });

  it('cuts donut arcs that add up to the whole, ignoring negatives', () => {
    const a = arcs([1, 3, -2]);
    expect(a.map((s) => s.size)).toEqual([25, 75, 0]);
    expect(a.map((s) => s.start)).toEqual([0, 25, 100]);
    expect(arcs([1, 1], 2).map((s) => s.size)).toEqual([48, 48]);
    expect(arcs([0, 0]).every((s) => s.size === 0)).toBe(true);
  });

  it('finds a point on a circle clockwise from twelve', () => {
    const [x, y] = polar(50, 50, 10, 90);
    expect(x).toBeCloseTo(60);
    expect(y).toBeCloseTo(50);
  });

  it('thins axis labels but keeps the first and last', () => {
    const s = sparseLabels(30, 6);
    expect(s.has(0)).toBe(true);
    expect(s.has(29)).toBe(true);
    expect(s.size).toBeLessThanOrEqual(7);
    expect([...sparseLabels(4)]).toEqual([0, 1, 2, 3]);
  });

  it('splits a total into whole parts that add up exactly', () => {
    expect(distribute(10, [1, 1, 1]).reduce((a, b) => a + b)).toBe(10);
    expect(distribute(5, [0, 0])).toEqual([0, 0]);
  });

  it('wraps the palette and shortens axis numbers', () => {
    expect(chartColor(0)).toBe('var(--viz-1)');
    expect(chartColor(5)).toBe('var(--viz-1)');
    expect(chartColor(-1)).toBe('var(--viz-5)');
    expect(compactNumber(1_200_000)).toBe('1.2M');
    expect(compactNumber(12)).toBe('12');
  });
});
