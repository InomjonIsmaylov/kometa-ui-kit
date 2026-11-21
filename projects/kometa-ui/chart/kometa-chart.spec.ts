import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaChart, KometaSeries, chartDomain } from './kometa-chart';

@Component({
  imports: [KometaChart],
  template: `<k-chart label="Takings" [series]="series()" [labels]="labels()" [stacked]="stacked()" [min]="min()" [max]="max()"
                     [band]="band()" [limit]="limit()" [now]="now()" [legend]="legend()" [unit]="unit()" />`,
})
class Host {
  series = signal<readonly KometaSeries[]>([{ name: 'Takings', values: [10, 20, 30] }]);
  labels = signal<readonly string[]>(['Mon', 'Tue', 'Wed']);
  stacked = signal(false);
  min = signal<number | null>(null);
  max = signal<number | null>(null);
  band = signal<readonly (readonly [number, number])[] | null>(null);
  limit = signal<{ value: number; label: string } | null>(null);
  now = signal<{ index: number; label: string } | null>(null);
  legend = signal<boolean | null>(null);
  unit = signal('');
}

describe('KometaChart', () => {
  function render(set: (h: Host) => void = () => {}) {
    const f = TestBed.createComponent(Host);
    set(f.componentInstance);
    f.detectChanges();
    const el = f.nativeElement.querySelector('k-chart') as HTMLElement;
    const all = (s: string) => Array.from(el.querySelectorAll(s)) as HTMLElement[];
    const plot = el.querySelector('.plot') as HTMLElement;
    const press = (key: string) => {
      plot.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
      f.detectChanges();
    };
    return { f, el, all, plot, press, grid: () => all('.grid b').map((b) => b.textContent!.trim()) };
  }

  it('draws a lone series as an amber line over its area, from 0 to a round top', () => {
    const { el, all, grid } = render();
    const line = all('.line');
    expect(line.length).toBe(1);
    expect(line[0].getAttribute('d')).toBe('M0 66.67L50 33.33L100 0');
    expect(line[0].style.stroke).toBe('var(--chart-color, var(--amber))');
    expect(all('.area').length).toBe(1);
    expect(grid()).toEqual(['0', '7.5', '15', '22.5', '30']);
    expect(el.querySelector('.legend')).toBeNull();
    expect(el.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true');
  });

  it('gives several series the palette, a legend, no areas by default, and dashes on request', () => {
    const { el, all } = render((h) => h.series.set([
      { name: 'This year', values: [1, 2, 3] },
      { name: 'Last year', values: [2, 2, 2], dashed: true },
      { name: 'Target', values: [3, 3, 3], color: 'var(--red)', area: true },
    ]));
    expect(all('.line').map((l) => l.style.stroke)).toEqual(['var(--viz-1)', 'var(--viz-2)', 'var(--red)']);
    expect(all('.line')[1].classList.contains('dashed')).toBe(true);
    expect(all('.area').length).toBe(1);
    expect(all('.legend li').map((l) => l.textContent!.trim())).toEqual(['This year', 'Last year', 'Target']);
  });

  it('hides or forces the legend with the legend input', () => {
    expect(render((h) => h.legend.set(true)).el.querySelector('.legend')).not.toBeNull();
    const many = render((h) => {
      h.series.set([{ name: 'A', values: [1] }, { name: 'B', values: [2] }]);
      h.legend.set(false);
    });
    expect(many.el.querySelector('.legend')).toBeNull();
  });

  it('stacks layers: each area sits on the one below and the domain covers the total', () => {
    const { all, grid } = render((h) => {
      h.stacked.set(true);
      h.series.set([{ name: 'Base', values: [1, 1] }, { name: 'Pro', values: [2, 2] }]);
      h.labels.set(['Jan', 'Feb']);
    });
    expect(grid().at(-1)).toBe('3');
    expect(all('.line').map((l) => l.getAttribute('d'))).toEqual(['M0 66.67L100 66.67', 'M0 0L100 0']);
    expect(all('.area').length).toBe(2);
    // The top layer's area runs back along the first layer's line, not down to the axis.
    expect(all('.area')[1].getAttribute('d')).toBe('M0 0L100 0L100 66.67L0 66.67Z');
  });

  it('reads each series own value in a stacked readout', () => {
    const { el, press } = render((h) => {
      h.stacked.set(true);
      h.series.set([{ name: 'Base', values: [1, 1] }, { name: 'Pro', values: [2, 2] }]);
    });
    press('ArrowRight');
    const rows = Array.from(el.querySelectorAll('.tip span')).map((s) => s.textContent!.replace(/\s+/g, ' ').trim());
    expect(rows).toEqual(['Base1', 'Pro2']);
  });

  it('shades a band and fits the axis to it instead of starting at 0', () => {
    const { el, grid } = render((h) => {
      h.series.set([{ name: 'Weight', values: [70, 72, 74] }]);
      h.band.set([[60, 80], [62, 82], [64, 84]]);
    });
    const d = el.querySelector('.band')!.getAttribute('d')!;
    expect(d.startsWith('M0 ')).toBe(true);
    expect(d.endsWith('Z')).toBe(true);
    expect(grid()[0]).toBe('60');
    expect(grid().at(-1)).toBe('90');
  });

  it('draws the limit with its label and lifts the axis to fit it', () => {
    const { el, grid } = render((h) => h.limit.set({ value: 40, label: 'Capacity 40' }));
    const limit = el.querySelector('.limit') as HTMLElement;
    expect(limit.textContent!.trim()).toBe('Capacity 40');
    expect(limit.style.bottom).toBe('100%');
    expect(grid().at(-1)).toBe('40');
  });

  it('keeps a given min and max exactly', () => {
    const { el, grid } = render((h) => {
      h.min.set(0);
      h.max.set(160);
      h.limit.set({ value: 120, label: 'Cap' });
    });
    expect(grid()).toEqual(['0', '40', '80', '120', '160']);
    expect((el.querySelector('.limit') as HTMLElement).style.bottom).toBe('75%');
  });

  it('marks now with a line, a dot on the first series and its label', () => {
    const { el } = render((h) => h.now.set({ index: 1, label: '20 now' }));
    expect((el.querySelector('.now-line') as HTMLElement).style.left).toBe('50%');
    const dot = el.querySelector('.now') as HTMLElement;
    expect(dot.style.left).toBe('50%');
    expect(parseFloat(dot.style.bottom)).toBeCloseTo(66.67, 1);
    expect(el.querySelector('.now-tag')!.textContent!.trim()).toBe('20 now');
  });

  it('moves a readout with the arrow keys, Home and End, and reads it out', () => {
    const { el, plot, press } = render((h) => h.unit.set(' so‘m'));
    expect(plot.getAttribute('tabindex')).toBe('0');
    expect(el.querySelector('.tip')).toBeNull();
    press('ArrowRight');
    expect(el.querySelector('.tip small')!.textContent).toBe('Mon');
    expect(el.querySelector('.tip b')!.textContent).toBe('10 so‘m');
    expect((el.querySelector('.cross') as HTMLElement).style.left).toBe('0%');
    press('ArrowRight');
    expect(el.querySelector('.tip small')!.textContent).toBe('Tue');
    expect(el.querySelector('[aria-live]')!.textContent).toBe('Tue: 20 so‘m');
    press('End');
    press('ArrowRight');
    expect(el.querySelector('.tip small')!.textContent).toBe('Wed');
    press('Home');
    expect(el.querySelector('.tip small')!.textContent).toBe('Mon');
  });

  it('starts from the right end on ArrowLeft and hides on blur', () => {
    const { f, el, plot, press } = render();
    press('ArrowLeft');
    expect(el.querySelector('.tip small')!.textContent).toBe('Wed');
    plot.dispatchEvent(new FocusEvent('blur'));
    f.detectChanges();
    expect(el.querySelector('.tip')).toBeNull();
  });

  it('follows the pointer to the nearest point', () => {
    const { f, el, plot } = render();
    plot.getBoundingClientRect = () => ({ left: 100, width: 200, top: 0, height: 220, right: 300, bottom: 220, x: 100, y: 0, toJSON: () => ({}) });
    plot.dispatchEvent(new MouseEvent('pointermove', { clientX: 290, bubbles: true }));
    f.detectChanges();
    expect(el.querySelector('.tip small')!.textContent).toBe('Wed');
    plot.dispatchEvent(new MouseEvent('pointerleave'));
    f.detectChanges();
    expect(el.querySelector('.tip')).toBeNull();
  });

  it('lists every value in a hidden table captioned with the label', () => {
    const { el } = render((h) => {
      h.series.set([{ name: 'A', values: [1200, 2] }, { name: 'B', values: [3] }]);
      h.unit.set(' kg');
    });
    const table = el.querySelector('table.sr')!;
    expect(table.querySelector('caption')!.textContent).toBe('Takings');
    expect(Array.from(table.querySelectorAll('thead th')).map((t) => t.textContent)).toEqual(['A', 'B']);
    const rows = Array.from(table.querySelectorAll('tbody tr')).map((r) => Array.from(r.children).map((c) => c.textContent));
    expect(rows).toEqual([['Mon', '1.2K kg', '3 kg'], ['Tue', '2 kg', ''], ['Wed', '', '']]);
  });

  it('thins the x labels and keeps the first and the last', () => {
    const { all } = render((h) => {
      h.labels.set(Array.from({ length: 30 }, (_, i) => `D${i + 1}`));
      h.series.set([{ name: 'T', values: Array.from({ length: 30 }, (_, i) => i) }]);
    });
    const wide = all('.x span.w').map((s) => s.textContent);
    expect(wide.length).toBeLessThanOrEqual(7);
    expect(wide[0]).toBe('D1');
    expect(wide.at(-1)).toBe('D30');
    expect(all('.x span.n').length).toBeLessThanOrEqual(5);
  });

  it('never prints NaN for empty data, a lone point or all-equal values', () => {
    for (const set of [
      (h: Host) => { h.series.set([]); h.labels.set([]); },
      (h: Host) => { h.series.set([{ name: 'A', values: [] }]); h.labels.set([]); },
      (h: Host) => { h.series.set([{ name: 'A', values: [5] }]); h.labels.set(['Only']); h.now.set({ index: 3, label: 'now' }); },
      (h: Host) => { h.series.set([{ name: 'A', values: [0, 0, 0] }]); },
      (h: Host) => { h.series.set([{ name: 'A', values: [-4, -4] }]); h.band.set([[-4, -4]]); },
      (h: Host) => { h.min.set(5); h.max.set(5); },
    ]) {
      const { el, press } = render(set);
      press('ArrowRight');
      expect(el.innerHTML).not.toContain('NaN');
      expect(el.innerHTML).not.toContain('Infinity');
    }
  });

  it('draws a lone point as a dot in the middle', () => {
    const { all } = render((h) => {
      h.series.set([{ name: 'A', values: [5] }]);
      h.labels.set([]);
    });
    expect(all('.line')[0].getAttribute('d')).toBe('M50 0L50 0');
  });

  it('keeps the entrance behind prefers-reduced-motion and k-seen', () => {
    const css = ((KometaChart as any).ɵcmp.styles as string[]).join('').replace(/%NS%/g, '');
    expect(css).toMatch(/prefers-reduced-motion:\s*no-preference/);
    expect(css).toMatch(/:not\(\.k-seen\)/);  });
});

describe('chartDomain', () => {
  it('runs from 0 to a round top', () => {
    expect(chartDomain([3, 26])).toEqual({ min: 0, max: 30, ticks: [0, 7.5, 15, 22.5, 30] });
  });
  it('goes below 0 for negative data on round steps', () => {
    const d = chartDomain([-12, 30]);
    expect(d.min).toBeLessThanOrEqual(-12);
    expect(d.max).toBeGreaterThanOrEqual(30);
    expect(d.ticks).toContain(0);
  });
  it('fits the data when asked and keeps a given min', () => {
    expect(chartDomain([62, 84], null, null, true)).toEqual({ min: 60, max: 90, ticks: [60, 70, 80, 90] });
    expect(chartDomain([62, 84], 61, null, true).min).toBe(61);
    expect(chartDomain([62, 84], 61, null, true).ticks[0]).toBe(61);
  });
  it('never returns a flat range for empty data', () => {
    expect(chartDomain([])).toEqual({ min: 0, max: 1, ticks: [0, 0.25, 0.5, 0.75, 1] });
  });
});
