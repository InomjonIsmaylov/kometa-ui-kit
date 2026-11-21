import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaBar, KometaBarSeries, KometaBars } from './kometa-bars';

@Component({
  imports: [KometaBars],
  template: `<k-bars [items]="items()" [series]="series()" [max]="max()" [mark]="mark()" [markLabel]="markLabel()"
                     [showValues]="showValues()" [axis]="axis()" label="Visits per day" />`,
})
class Host {
  items = signal<readonly KometaBar[]>([
    { label: 'Mon', value: 12 },
    { label: 'Tue', value: 26.2, note: 'Tuesday 3 March' },
    { label: 'Wed', value: 0, color: 'var(--viz-2)' },
  ]);
  series = signal<readonly KometaBarSeries[]>([]);
  max = signal<number | null>(null);
  mark = signal(-1);
  markLabel = signal('');
  showValues = signal(false);
  axis = signal(true);
}

describe('KometaBars', () => {
  function render(set?: (h: Host) => void) {
    const f = TestBed.createComponent(Host);
    set?.(f.componentInstance);
    f.detectChanges();
    const el = f.nativeElement.querySelector('k-bars') as HTMLElement;
    const bars = () => Array.from(el.querySelectorAll('.bar')) as HTMLElement[];
    const pct = (b: HTMLElement, p: 'height' | 'bottom') => parseFloat(b.style[p]);
    const text = (sel: string) => Array.from(el.querySelectorAll(sel)).map((n) => n.textContent!.trim());
    return { f, el, bars, pct, text };
  }

  it('scales bars to a round top over the tallest figure', () => {
    const { bars, pct } = render();
    expect(bars().length).toBe(3);
    // niceMax(26.2) = 30
    expect(pct(bars()[0], 'height')).toBeCloseTo(40);
    expect(pct(bars()[1], 'height')).toBeCloseTo(87.33, 1);
    expect(pct(bars()[2], 'height')).toBe(0);
    expect(bars().every((b) => pct(b, 'bottom') === 0)).toBe(true);
  });

  it('draws gridlines with round tick labels, and only the baseline without the axis', () => {
    const { f, el, text } = render();
    expect(text('.grid b')).toEqual(['0', '10', '20', '30']);
    f.componentInstance.axis.set(false);
    f.detectChanges();
    expect(el.querySelectorAll('.grid').length).toBe(1);
    expect(el.querySelector('.grid b')).toBeNull();
    expect(el.classList.contains('axis')).toBe(false);
  });

  it('takes max as the top and cuts a taller bar', () => {
    const { bars, pct, text } = render((h) => h.max.set(20));
    expect(pct(bars()[0], 'height')).toBeCloseTo(60);
    expect(pct(bars()[1], 'height')).toBe(100);
    expect(text('.grid b').at(-1)).toBe('20');
  });

  it('has no NaN for empty or all-zero data', () => {
    const empty = render((h) => h.items.set([]));
    expect(empty.bars().length).toBe(0);
    expect(empty.el.innerHTML).not.toContain('NaN');
    const zeros = render((h) => h.items.set([{ label: 'a', value: 0 }, { label: 'b', value: Number.NaN }]));
    expect(zeros.el.innerHTML).not.toContain('NaN');
    expect(zeros.bars().map((b) => zeros.pct(b, 'height'))).toEqual([0, 0]);
  });

  it('colours a bar from its item, falling back to --bars-color', () => {
    const { bars } = render();
    expect(bars()[2].style.getPropertyValue('--bar-c')).toBe('var(--viz-2)');
    expect(bars()[0].style.getPropertyValue('--bar-c')).toBe('');
    const css = stylesheet();
    expect(css).toContain('var(--bar-c, var(--bars-color, var(--amber)))');
  });

  it('draws grouped bars per series with palette colours and a legend', () => {
    const { el, bars, text } = render((h) => {
      h.items.set([{ label: 'Jan', value: [10, 4] }, { label: 'Feb', value: [12, 6] }]);
      h.series.set([{ name: 'Joined' }, { name: 'Left', color: 'var(--red)' }]);
    });
    expect(bars().length).toBe(4);
    expect(el.querySelectorAll('.col')[0].querySelectorAll('.bar').length).toBe(2);
    expect(bars()[0].style.getPropertyValue('--bar-c')).toBe('var(--viz-1)');
    expect(bars()[1].style.getPropertyValue('--bar-c')).toBe('var(--red)');
    expect(text('.legend li')).toEqual(['Joined', 'Left']);
    expect(text('table thead th')).toEqual(['Joined', 'Left']);
    expect(el.querySelectorAll('.col')[0].getAttribute('data-tip')).toBe('Jan');
  });

  it('hangs a negative figure below the zero line', () => {
    const { bars, pct, text } = render((h) => h.items.set([{ label: 'Jan', value: [20, -5] }]));
    // Domain -5..20: the zero line sits at 20%.
    const [up, down] = bars();
    expect(pct(up, 'bottom')).toBeCloseTo(20);
    expect(pct(up, 'height')).toBeCloseTo(80);
    expect(down.classList.contains('neg')).toBe(true);
    expect(pct(down, 'bottom')).toBeCloseTo(0);
    expect(pct(down, 'height')).toBeCloseTo(20);
    expect(text('.grid b')).toContain('0');
    expect(text('.grid b')[0]).toBe('-5');
  });

  it('prints figures over the bars with showValues', () => {
    const { el, text } = render((h) => h.showValues.set(true));
    expect(text('.val')).toEqual(['12', '26.2', '0']);
    expect(render().el.querySelector('.val')).toBeNull();
    expect(el.querySelector('.plot')!.getAttribute('style')).toContain('24px');
  });

  it('marks a bar, dims the rest and pins its label', () => {
    const { el, text } = render((h) => { h.mark.set(1); h.markLabel.set('Now'); });
    expect(el.classList.contains('marked')).toBe(true);
    const cols = el.querySelectorAll('.col');
    expect(cols[1].classList.contains('mark')).toBe(true);
    expect(text('.pin')).toEqual(['Now']);
    expect(text('table th[scope=row]')[1]).toBe('Tuesday 3 March, Now');
    const css = stylesheet();
    expect(css).toMatch(/\.marked\)?\s+\.col:not\(\.mark\)\s+\.bar[^{]*\{[^}]*color-mix/);
    expect(css).toMatch(/\.pin[^{]*\{[^}]*background: var\(--red\)[^}]*color: var\(--bg\)/);
  });

  it('thins out crowded axis labels, keeping the first and last', () => {
    const items = Array.from({ length: 24 }, (_, i) => ({ label: `${i}:00`, value: i }));
    const { text } = render((h) => h.items.set(items));
    const shown = text('.x span').filter(Boolean);
    expect(shown.length).toBeLessThanOrEqual(8);
    expect(shown[0]).toBe('0:00');
    expect(shown.at(-1)).toBe('23:00');
  });

  it('hides the drawing and reads a table with the label, note and formatted figures', () => {
    const { el, text } = render();
    expect(el.firstElementChild!.getAttribute('aria-hidden')).toBe('true');
    expect(el.querySelector('table caption')!.textContent).toBe('Visits per day');
    expect(text('table th[scope=row]')).toEqual(['Mon', 'Tuesday 3 March', 'Wed']);
    expect(text('table td')).toEqual(['12', '26.2', '0']);
    expect(el.querySelectorAll('.col')[1].getAttribute('data-tip')).toBe('Tuesday 3 March');
  });

  it('formats with the given function', () => {
    const f = TestBed.createComponent(KometaBars);
    f.componentRef.setInput('items', [{ label: 'a', value: 1500 }]);
    f.componentRef.setInput('label', 'x');
    f.detectChanges();
    expect((f.nativeElement as HTMLElement).querySelector('td')!.textContent).toBe('1.5K');
    f.componentRef.setInput('format', (v: number) => `${v} so'm`);
    f.detectChanges();
    expect((f.nativeElement as HTMLElement).querySelector('td')!.textContent).toBe("1500 so'm");
  });

  it('grows bars in turn once seen, only when motion is welcome', () => {
    const { el } = render();
    expect((el.querySelectorAll('.col')[2] as HTMLElement).style.getPropertyValue('--i')).toBe('2');
    const css = stylesheet();
    expect(css).toMatch(/prefers-reduced-motion: no-preference\)[\s\S]*:not\(\.k-seen\)\)?\s+\.bar[^{]*\{[^}]*scaleY\(0\)/);
    expect(css).toMatch(/\.k-seen\)?\s+\.bar[^{]*\{[^}]*animation:/);
  });

  it('uses tokens and no colour literals', () => {
    const css = stylesheet();
    for (const t of ['var(--border)', 'var(--muted)', 'var(--text)', 'var(--bars-height, 160px)']) expect(css).toContain(t);
    expect(css.replace(/var\([^)]*\)/g, '')).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(/);
  });
});

function stylesheet(): string {
  const def = (KometaBars as unknown as { ɵcmp: { styles?: string[] | string } }).ɵcmp;
  const css = def.styles == null ? '' : Array.isArray(def.styles) ? def.styles.join('\n') : String(def.styles);
  return css.replace(/%NS%/g, '').replace(/\[_ng(?:content|host)-[^\]]*\]/g, '');
}
