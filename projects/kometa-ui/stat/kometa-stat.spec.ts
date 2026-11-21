import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaStat } from './kometa-stat';

@Component({
  imports: [KometaStat],
  template: `
    <k-stat label="Revenue" [value]="value()" unit="so'm" [sub]="sub()" [trend]="trend()" [trendGood]="good()"
            [trendUnit]="trendUnit()" [trendLabel]="trendLabel()" locale="en-US" [duration]="0" [loading]="loading()" [bare]="bare()">
      <button k-stat-note type="button">i</button>
      <i class="spark"></i>
    </k-stat>
  `,
})
class Host {
  value = signal<number | string | null>(1200);
  sub = signal('12 checks closed');
  trend = signal<number | null>(12);
  good = signal<'up' | 'down'>('up');
  trendUnit = signal('%');
  trendLabel = signal('vs last week');
  loading = signal(false);
  bare = signal(false);
}

describe('KometaStat', () => {
  function render() {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const el = f.nativeElement.querySelector('k-stat') as HTMLElement;
    const set = (patch: (h: Host) => void) => { patch(f.componentInstance); f.detectChanges(); };
    const q = (s: string) => el.querySelector(s) as HTMLElement | null;
    const text = (s: string) => q(s)?.textContent!.replace(/\s+/g, ' ').trim();
    return { f, el, set, q, text };
  }
  const css = () => ((KometaStat as unknown as { ɵcmp: { styles: string[] } }).ɵcmp.styles.join('')).replace(/%NS%/g, '');

  it('shows the eyebrow with the note slot beside it, then the figure, trend, sub and the default slot in order', () => {
    const { el, q, text } = render();
    expect(text('.label > span')).toBe('Revenue');
    expect(q('.label [k-stat-note]')).not.toBeNull();
    const order = Array.from(el.children).map((c) => c.className.split(' ')[0] || c.tagName.toLowerCase());
    expect(order).toEqual(['label', 'fig', 'trend', 'sub', 'spark']);
    expect(text('.sub')).toBe('12 checks closed');
  });

  it('counts a number up through k-tally with the unit and locale', () => {
    const { q } = render();
    expect(q('.fig k-tally')).not.toBeNull();
    expect(q('k-tally .sr')!.textContent!.trim()).toBe("1,200 so'm");
  });

  it('shows a string as is, with its unit, and no figure for null or an empty string', () => {
    const { set, q, text } = render();
    set((h) => h.value.set('4.8'));
    expect(q('k-tally')).toBeNull();
    expect(text('.fig')).toBe("4.8so'm");
    expect(q('.fig .unit')!.textContent).toBe("so'm");
    set((h) => h.value.set(null));
    expect(q('.fig')).toBeNull();
    set((h) => h.value.set(''));
    expect(q('.fig')).toBeNull();
  });

  it('shows a rising trend green with an arrow the screen reader skips, read as +12% and its label', () => {
    const { q, text } = render();
    expect(q('.trend')!.classList.contains('good')).toBe(true);
    expect(q('.trend [aria-hidden=true]')!.textContent).toBe('▲ 12%');
    expect(q('.trend .sr')!.textContent).toBe('+12%');
    expect(text('.trend')).toBe('▲ 12%+12% vs last week');
  });

  it('shows a falling trend red, or green when down is good', () => {
    const { set, q } = render();
    set((h) => h.trend.set(-4.25));
    expect(q('.trend')!.classList.contains('bad')).toBe(true);
    expect(q('.trend [aria-hidden=true]')!.textContent).toBe('▼ 4.3%');
    expect(q('.trend .sr')!.textContent).toBe('−4.3%');
    set((h) => h.good.set('down'));
    expect(q('.trend')!.classList.contains('good')).toBe(true);
    set((h) => h.trend.set(7));
    expect(q('.trend')!.classList.contains('bad')).toBe(true);
  });

  it('shows a flat trend uncoloured without an arrow, and no trend for null', () => {
    const { set, q } = render();
    set((h) => h.trend.set(0));
    const t = q('.trend')!;
    expect(t.classList.contains('good') || t.classList.contains('bad')).toBe(false);
    expect(q('.trend [aria-hidden=true]')!.textContent).toBe('0%');
    set((h) => h.trend.set(null));
    expect(q('.trend')).toBeNull();
  });

  it('takes a trend unit for a plain count, and leaves out an empty trend label and sub', () => {
    const { set, q, text } = render();
    set((h) => { h.trend.set(18); h.trendUnit.set(''); h.trendLabel.set(''); h.sub.set(''); });
    expect(q('.trend .sr')!.textContent).toBe('+18');
    expect(text('.trend')).toBe('▲ 18+18');
    expect(q('.sub')).toBeNull();
  });

  it('holds the figure place with a skeleton and sets aria-busy while loading', () => {
    const { el, set, q } = render();
    expect(el.getAttribute('aria-busy')).toBeNull();
    set((h) => h.loading.set(true));
    expect(q('.fig k-skeleton')).not.toBeNull();
    expect(q('k-tally')).toBeNull();
    expect(el.getAttribute('aria-busy')).toBe('true');
  });

  it('drops the surface when bare and reads its look from CSS vars', () => {
    const { el, set } = render();
    expect(el.classList.contains('bare')).toBe(false);
    set((h) => h.bare.set(true));
    expect(el.classList.contains('bare')).toBe(true);
    for (const v of ['--stat-bg', '--stat-border', '--stat-radius', '--stat-pad', '--stat-gap', '--stat-figure-size', '--stat-up', '--stat-down', '--stat-label-color']) {
      expect(css()).toContain(v);
    }
  });
});
