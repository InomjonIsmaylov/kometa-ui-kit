import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaTiles, kometaTileColumns } from './kometa-tiles';

describe('kometaTileColumns', () => {
  // The widths at which 1..6 tiles of 180px with a 16px gap fit on one row.
  const fits = (n: number) => n * 180 + (n - 1) * 16;
  const rows = (count: number, width: number, max: number | null = null) => kometaTileColumns(count, width, 180, 16, max).rows;

  it('takes five tiles from 5 to 3+2 to 2+2+1 to one column', () => {
    expect(rows(5, fits(5))).toEqual([5]);
    expect(rows(5, fits(5) - 1)).toEqual([3, 2]);
    expect(rows(5, fits(3))).toEqual([3, 2]);
    expect(rows(5, fits(3) - 1)).toEqual([2, 2, 1]);
    expect(rows(5, fits(2) - 1)).toEqual([1, 1, 1, 1, 1]);
  });

  it('takes four tiles from 4 to 2+2', () => {
    expect(rows(4, fits(4))).toEqual([4]);
    expect(rows(4, fits(3))).toEqual([2, 2]);
    expect(rows(4, fits(2))).toEqual([2, 2]);
  });

  it('takes seven tiles from 4+3 to 3+2+2', () => {
    expect(rows(7, fits(6))).toEqual([4, 3]);
    expect(rows(7, fits(4))).toEqual([4, 3]);
    expect(rows(7, fits(3))).toEqual([3, 2, 2]);
    expect(rows(7, fits(2))).toEqual([2, 2, 2, 1]);
  });

  it('never leaves a lone tile on a row above two columns', () => {
    for (let count = 1; count <= 40; count++) {
      for (let width = 100; width <= 2400; width += 37) {
        const l = kometaTileColumns(count, width, 180, 16);
        expect(l.rows.reduce((a, b) => a + b, 0)).toBe(count);
        expect(Math.max(...l.rows) - Math.min(...l.rows)).toBeLessThanOrEqual(1);
        expect(l.columns).toBe(l.rows[0]);
        if (l.columns > 2) expect(Math.min(...l.rows)).toBeGreaterThan(1);
        // No tile is narrower than min, unless even one column is.
        if (l.columns > 1) expect(l.columns * 180 + (l.columns - 1) * 16).toBeLessThanOrEqual(width);
      }
    }
  });

  it('spans every row exactly across the tracks, so the last row stretches', () => {
    expect(kometaTileColumns(5, 700)).toEqual({ columns: 3, rows: [3, 2], tracks: 6, spans: [2, 2, 2, 3, 3] });
    expect(kometaTileColumns(5, 400)).toEqual({ columns: 2, rows: [2, 2, 1], tracks: 2, spans: [1, 1, 1, 1, 2] });
    expect(kometaTileColumns(7, 800)).toEqual({ columns: 4, rows: [4, 3], tracks: 12, spans: [3, 3, 3, 3, 4, 4, 4] });
    expect(kometaTileColumns(6, 2000)).toEqual({ columns: 6, rows: [6], tracks: 6, spans: [1, 1, 1, 1, 1, 1] });
    for (let count = 1; count <= 30; count++) {
      const l = kometaTileColumns(count, 1000, 120, 8);
      let i = 0;
      for (const r of l.rows) {
        expect(l.spans.slice(i, i + r).reduce((a, b) => a + b, 0)).toBe(l.tracks);
        i += r;
      }
    }
  });

  it('caps the row at max', () => {
    expect(rows(5, 5000, 4)).toEqual([3, 2]);
    expect(rows(8, 5000, 4)).toEqual([4, 4]);
    expect(rows(3, 5000, 1)).toEqual([1, 1, 1]);
  });

  it('copes with no tiles, one tile, a zero width and odd inputs', () => {
    expect(kometaTileColumns(0, 800)).toEqual({ columns: 1, rows: [], tracks: 1, spans: [] });
    expect(kometaTileColumns(1, 5000)).toEqual({ columns: 1, rows: [1], tracks: 1, spans: [1] });
    expect(rows(3, 0)).toEqual([1, 1, 1]);
    expect(rows(3, NaN)).toEqual([1, 1, 1]);
    expect(kometaTileColumns(-2, 800).rows).toEqual([]);
    expect(kometaTileColumns(4, 800, 0, 0, 0).rows).toEqual([1, 1, 1, 1]);
    expect(kometaTileColumns(4, 800, 0, 0).rows).toEqual([4]);
  });
});

@Component({
  imports: [KometaTiles],
  template: `<k-tiles [min]="180" [gap]="gap()" [max]="max()">@for (t of tiles(); track t) {<div class="t">{{ t }}</div>}</k-tiles>`,
})
class Host {
  tiles = signal([1, 2, 3, 4, 5]);
  gap = signal(16);
  max = signal<number | null>(null);
}

describe('KometaTiles', () => {
  let resize: ((entries: { contentRect: { width: number } }[]) => void) | null;
  let observed: Element[];
  const Real = globalThis.ResizeObserver;
  beforeEach(() => {
    resize = null;
    observed = [];
    globalThis.ResizeObserver = class {
      constructor(cb: typeof resize) { resize = cb; }
      observe(el: Element) { observed.push(el); }
      unobserve() {}
      disconnect() { resize = null; }
    } as unknown as typeof ResizeObserver;
  });
  afterEach(() => (globalThis.ResizeObserver = Real));

  async function render() {
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    const el = f.nativeElement.querySelector('k-tiles') as HTMLElement;
    const spans = () => Array.from(el.children).map((c) => (c as HTMLElement).style.gridColumn);
    const width = async (w: number) => { resize!([{ contentRect: { width: w } }]); await f.whenStable(); };
    return { f, el, spans, width };
  }

  it('is an auto-fit grid until it has measured its width', async () => {
    const { el, spans } = await render();
    expect(el.style.gridTemplateColumns).toBe('repeat(auto-fit, minmax(min(180px, 100%), 1fr))');
    expect(el.style.gap).toBe('16px');
    expect(spans()).toEqual(['', '', '', '', '']);
  });

  it('lays five tiles out 3+2 on six tracks once measured, then 2+2+1 and 5 as the width changes', async () => {
    const { el, spans, width } = await render();
    expect(observed).toEqual([el]);
    await width(700);
    expect(el.style.gridTemplateColumns).toBe('repeat(6, minmax(0, 1fr))');
    expect(spans()).toEqual(['span 2', 'span 2', 'span 2', 'span 3', 'span 3']);
    await width(400);
    expect(el.style.gridTemplateColumns).toBe('repeat(2, minmax(0, 1fr))');
    expect(spans()).toEqual(['span 1', 'span 1', 'span 1', 'span 1', 'span 2']);
    await width(1200);
    expect(el.style.gridTemplateColumns).toBe('repeat(5, minmax(0, 1fr))');
    expect(spans()).toEqual(['span 1', 'span 1', 'span 1', 'span 1', 'span 1']);
  });

  it('follows tiles being added or removed', async () => {
    const { f, el, spans, width } = await render();
    await width(800);
    f.componentInstance.tiles.set([1, 2, 3, 4]);
    await f.whenStable();
    await new Promise((r) => setTimeout(r));
    await f.whenStable();
    expect(el.style.gridTemplateColumns).toBe('repeat(4, minmax(0, 1fr))');
    expect(spans()).toEqual(['span 1', 'span 1', 'span 1', 'span 1']);
    f.componentInstance.tiles.set([1, 2, 3, 4, 5, 6, 7]);
    await f.whenStable();
    await new Promise((r) => setTimeout(r));
    await f.whenStable();
    expect(el.style.gridTemplateColumns).toBe('repeat(12, minmax(0, 1fr))');
    expect(spans()).toEqual(['span 3', 'span 3', 'span 3', 'span 3', 'span 4', 'span 4', 'span 4']);
  });

  it('follows its gap and max inputs', async () => {
    const { f, el, spans, width } = await render();
    await width(5000);
    f.componentInstance.max.set(4);
    await f.whenStable();
    expect(spans()).toEqual(['span 2', 'span 2', 'span 2', 'span 3', 'span 3']);
    f.componentInstance.max.set(null);
    f.componentInstance.gap.set(40);
    await f.whenStable();
    expect(el.style.gap).toBe('40px');
    expect(el.style.gridTemplateColumns).toBe('repeat(5, minmax(0, 1fr))');
  });

  it('stops observing when destroyed', async () => {
    const { f } = await render();
    expect(resize).not.toBeNull();
    f.destroy();
    expect(resize).toBeNull();
  });
});
