import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaHeat, KometaHeatDay, KometaHeatRow } from './kometa-heat';

@Component({
  imports: [KometaHeat],
  template: `<k-heat [rows]="rows()" [cols]="cols()" [days]="days()" [max]="max()" [weekStart]="weekStart()"
                     unit="visits" label="Visits by day and hour" />`,
})
class Host {
  rows = signal<readonly KometaHeatRow[]>([
    { label: 'Mon', values: [0, 4, 8] },
    { label: 'Tue', values: [2, null] },
  ]);
  cols = signal<readonly string[]>(['9', '10', '11']);
  days = signal<readonly KometaHeatDay[]>([]);
  max = signal<number | null>(null);
  weekStart = signal<0 | 1>(1);
}

// 2026-03-01 is a Sunday.
const MARCH: KometaHeatDay[] = [
  { date: '2026-04-14', value: 6 },
  { date: '2026-03-04', value: 3 },
  { date: '2026-03-05', value: 0 },
];

describe('KometaHeat', () => {
  function render(set?: (h: Host) => void) {
    const f = TestBed.createComponent(Host);
    set?.(f.componentInstance);
    f.detectChanges();
    const el = f.nativeElement.querySelector('k-heat') as HTMLElement;
    const text = (sel: string) => Array.from(el.querySelectorAll(sel)).map((n) => n.textContent!.trim());
    const alpha = (c: Element) => (c as HTMLElement).style.getPropertyValue('--a');
    return { f, el, text, alpha };
  }

  describe('matrix', () => {
    it('is a real table with column and row headers and the caption', () => {
      const { el, text } = render();
      expect(el.querySelector('table caption')!.textContent).toBe('Visits by day and hour');
      expect(text('thead th[scope=col]')).toEqual(['9', '10', '11']);
      expect(text('tbody th[scope=row]')).toEqual(['Mon', 'Tue']);
      expect(el.querySelectorAll('tbody td').length).toBe(6);
      expect(text('tbody tr:first-child td')).toEqual(['0 visits', '4 visits', '8 visits']);
    });

    it('scales α to the largest figure, with zero empty and null or missing a gap', () => {
      const { el, alpha } = render();
      const [zero, four, eight, two, nul, missing] = Array.from(el.querySelectorAll('tbody td'));
      expect(zero.classList.contains('empty')).toBe(true);
      expect(eight.classList.contains('cell')).toBe(true);
      expect(alpha(eight)).toBe('1');
      expect(parseFloat(alpha(four))).toBeCloseTo(0.575, 1);
      expect(parseFloat(alpha(two))).toBeCloseTo(0.3625, 1);
      for (const gap of [nul, missing]) {
        expect(gap.classList.contains('none')).toBe(true);
        expect(gap.getAttribute('data-tip')).toBeNull();
        expect(gap.textContent!.trim()).toBe('');
      }
    });

    it('takes max as the full colour and caps figures over it', () => {
      const { el, alpha } = render((h) => h.max.set(4));
      const cells = el.querySelectorAll('tbody td');
      expect(alpha(cells[1])).toBe('1');
      expect(alpha(cells[2])).toBe('1');
    });

    it('gives each cell a tooltip of row, column and formatted figure', () => {
      const { el } = render((h) => h.rows.set([{ label: 'Mon', values: [1500] }]));
      const td = el.querySelector('tbody td')!;
      expect(td.getAttribute('data-tip')).toBe('Mon 9');
      expect(td.textContent!.trim()).toBe('1.5K visits');
    });

    it('scrolls sideways in a named region instead of shrinking cells', () => {
      const { el } = render();
      const region = el.querySelector('.scroll')!;
      expect(region.getAttribute('role')).toBe('region');
      expect(region.getAttribute('tabindex')).toBe('0');
      expect(region.getAttribute('aria-label')).toBe('Visits by day and hour');
      expect((el.querySelector('table') as HTMLElement).style.getPropertyValue('--n')).toBe('3');
      const css = stylesheet();
      expect(css).toMatch(/\.scroll[^{]*\{[^}]*overflow-x: auto/);
      expect(css).toMatch(/table[^{]*\{[^}]*min-width: calc\(var\(--heat-label-width, 48px\) \+ var\(--n\) \* \(var\(--heat-cell-min, 28px\)/);
    });

    it('has no NaN for empty or all-zero data', () => {
      const empty = render((h) => { h.rows.set([]); h.cols.set([]); });
      expect(empty.el.innerHTML).not.toContain('NaN');
      const zeros = render((h) => h.rows.set([{ label: 'Mon', values: [0, 0, Number.NaN] }]));
      expect(zeros.el.innerHTML).not.toContain('NaN');
      expect(zeros.el.querySelectorAll('td.empty').length).toBe(2);
    });
  });

  describe('calendar', () => {
    const cal = (h: Host) => h.days.set(MARCH);

    it('lays days out as weekday rows by week columns from the first to the last day', () => {
      const { el } = render(cal);
      expect(el.querySelector('table')).toBeNull();
      expect((el.querySelector('.cal') as HTMLElement).style.getPropertyValue('--weeks')).toBe('7');
      const cells = Array.from(el.querySelectorAll('.days i'));
      expect(cells.length).toBe(49);
      // Monday 2 March and Tuesday 3 March come before the first day.
      expect(cells.slice(0, 2).every((c) => c.classList.contains('pad'))).toBe(true);
      expect(cells[2].getAttribute('data-tip')).toBe('Wed, Mar 4, 2026');
      expect(cells[3].classList.contains('empty')).toBe(true);
      expect(cells[4].classList.contains('none')).toBe(true);
      expect(cells[43].getAttribute('data-tip')).toBe('Tue, Apr 14, 2026');
      expect(cells.slice(44).every((c) => c.classList.contains('pad'))).toBe(true);
      expect((cells[43] as HTMLElement).style.getPropertyValue('--d')).toBe('6');
    });

    it('names the months over their first week and every other weekday', () => {
      const { text } = render(cal);
      expect(text('.months span')).toEqual(['Mar', 'Apr']);
      expect(text('.wd span')).toEqual(['Mon', '', 'Wed', '', 'Fri', '', '']);
    });

    it('starts the week on Sunday with weekStart 0', () => {
      const { el, text } = render((h) => { cal(h); h.weekStart.set(0); });
      expect(text('.wd span')).toEqual(['', 'Mon', '', 'Wed', '', 'Fri', '']);
      const cells = el.querySelectorAll('.days i');
      expect(cells[3].getAttribute('data-tip')).toBe('Wed, Mar 4, 2026');
    });

    it('reads every given day from a hidden list and hides the drawing', () => {
      const { el, text } = render(cal);
      expect(el.querySelector('.cal')!.getAttribute('aria-hidden')).toBe('true');
      expect(text('ul.sr li')).toEqual(['Wed, Mar 4, 2026: 3 visits', 'Thu, Mar 5, 2026: 0 visits', 'Tue, Apr 14, 2026: 6 visits']);
      expect(el.querySelector('.scroll')!.getAttribute('aria-label')).toBe('Visits by day and hour');
    });

    it('ignores dates it cannot read', () => {
      const { el } = render((h) => h.days.set([{ date: '3 March', value: 2 }, { date: '2026-03-02', value: 1 }]));
      expect(el.querySelectorAll('.days i').length).toBe(7);
      expect(el.innerHTML).not.toContain('NaN');
    });
  });

  it('shows a less → more key under the cells', () => {
    const { el, text } = render();
    const key = el.querySelector('.key')!;
    expect(key.getAttribute('aria-hidden')).toBe('true');
    expect(text('.key span')).toEqual(['Less', 'More']);
    expect(key.querySelectorAll('.cell').length).toBe(5);
    expect(key.querySelector('.cell')!.classList.contains('empty')).toBe(true);
  });

  it('fades cells in once seen, only when motion is welcome', () => {
    const css = stylesheet();
    expect(css).toMatch(/prefers-reduced-motion: no-preference\)[\s\S]*:not\(\.k-seen\)\)?\s+\.scroll\s+\.cell[^{]*\{[^}]*opacity: 0/);
    expect(css).toMatch(/\.k-seen\)?\s+\.scroll\s+\.cell[^{]*\{[^}]*animation:/);
  });

  it('shades with --heat-rgb over --viz-heat and uses no colour literals', () => {
    const css = stylesheet();
    expect(css).toContain('rgba(var(--heat-rgb, var(--viz-heat)), var(--a))');
    expect(css.replace(/var\([^)]*\)/g, '')).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});

function stylesheet(): string {
  const def = (KometaHeat as unknown as { ɵcmp: { styles?: string[] | string } }).ɵcmp;
  const css = def.styles == null ? '' : Array.isArray(def.styles) ? def.styles.join('\n') : String(def.styles);
  return css.replace(/%NS%/g, '').replace(/\[_ng(?:content|host)-[^\]]*\]/g, '');
}
