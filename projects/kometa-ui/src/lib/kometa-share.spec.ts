import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaShare, type KometaShareSegment } from './kometa-share';

@Component({
  imports: [KometaShare],
  template: `<kometa-share [segments]="segments()" label="Taken this month" />`,
})
class Host {
  segments = signal<KometaShareSegment[]>([
    { label: 'Cash', value: 6_200_000, text: '6 200 000', color: 'var(--a)' },
    { label: 'Card', value: 4_100_000, text: '4 100 000', color: 'var(--b)' },
    { label: 'Advances', value: 100_000, text: '100 000', color: 'var(--c)' },
    { label: 'Refund', value: -50_000, text: '-50 000', color: 'var(--d)' },
  ]);
}

describe('KometaShare', () => {
  function render() {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const root = f.nativeElement.querySelector('kometa-share') as HTMLElement;
    const colours = () => [...root.querySelectorAll<HTMLElement>('.ticks i')].map((i) => i.style.getPropertyValue('--k'));
    return { f, root, colours };
  }

  it('is one image named by the caller, with the legend beside it', () => {
    const { root } = render();
    expect(root.querySelector('.ticks')?.getAttribute('role')).toBe('img');
    expect(root.querySelector('.ticks')?.getAttribute('aria-label')).toBe('Taken this month');
    expect(root.querySelectorAll('.legend > div')).toHaveLength(4);
  });

  it('draws each slice as a run of ticks in its own colour, in order, in proportion', () => {
    const { colours } = render();
    const c = colours();
    expect(c.filter((x) => x === 'var(--a)').length).toBeGreaterThan(c.filter((x) => x === 'var(--b)').length);
    expect(c.indexOf('var(--a)')).toBe(0);
    expect(c.lastIndexOf('var(--a)')).toBeLessThan(c.indexOf('var(--b)'));
  });

  it('gives a thin positive slice one tick, and a negative one none', () => {
    const { colours } = render();
    expect(colours().filter((x) => x === 'var(--c)')).toHaveLength(1);
    expect(colours()).not.toContain('var(--d)');
  });

  it("lists every slice with its share and the caller's own amount text, and marks a negative one", () => {
    const { root } = render();
    const rows = [...root.querySelectorAll('.legend > div')];
    expect(rows[0].querySelector('dt')?.textContent).toContain('Cash');
    expect(rows[0].querySelector('em')?.textContent).toBe('60%');
    expect(rows[0].querySelector('dd')?.textContent).toBe('6 200 000');
    expect(rows[3].querySelector('em')?.textContent).toBe('');
    expect(rows[3].querySelector('dd')?.classList.contains('negative')).toBe(true);
  });

  it('steps a slice with nothing in it back, and draws grey ticks when there is nothing at all', () => {
    const { f, root, colours } = render();
    f.componentInstance.segments.set([{ label: 'Cash', value: 0, text: '0', color: 'var(--a)' }]);
    f.detectChanges();
    expect(root.querySelector('.legend > div')?.classList.contains('zero')).toBe(true);
    expect(root.querySelector('.ticks')?.classList.contains('none')).toBe(true);
    expect(colours().length).toBeGreaterThan(0);
    expect(colours().every((x) => x === '')).toBe(true);
  });
});
