import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaDonut, KometaDonutItem } from './kometa-donut';

@Component({
  imports: [KometaDonut],
  template: `<k-donut [items]="items()" label="Visits by service" caption="visits" [legend]="legend()" />
             <k-donut class="own" [items]="items()" label="Own middle"><b class="mine">Mine</b></k-donut>`,
})
class Host {
  items = signal<KometaDonutItem[]>([{ label: 'Haircut', value: 30 }, { label: 'Colour', value: 10, color: 'var(--green)' }]);
  legend = signal(true);
}

function setup() {
  const f = TestBed.createComponent(Host);
  f.detectChanges();
  return { f, el: f.nativeElement.querySelector('k-donut') as HTMLElement };
}
const segs = (el: HTMLElement) => Array.from(el.querySelectorAll('.seg')) as SVGElement[];

describe('KometaDonut', () => {
  it('cuts one arc per item, coloured from the palette unless given, with a legend of figures and shares', () => {
    const { el } = setup();
    const s = segs(el);
    expect(s).toHaveLength(2);
    expect(s[0].style.stroke).toBe('var(--viz-1)');
    expect(s[1].style.stroke).toBe('var(--green)');
    expect(s[0].style.strokeDasharray).toBe('74.2 25.8');
    const rows = Array.from(el.querySelectorAll('.legend li')).map((li) => Array.from(li.querySelectorAll('span')).map((x) => x.textContent!.trim()).join(' '));
    expect(rows).toEqual(['Haircut 30 75%', 'Colour 10 25%']);
    expect(el.querySelector('svg')!.getAttribute('aria-label')).toBe('Visits by service');
  });

  it('shows the total and caption in the middle, and a slice while it is pointed at', () => {
    const { f, el } = setup();
    expect(el.querySelector('.mid')!.textContent).toContain('40');
    expect(el.querySelector('.mid')!.textContent).toContain('visits');
    segs(el)[1].dispatchEvent(new Event('pointerenter'));
    f.detectChanges();
    expect(el.querySelector('.mid .sum')!.textContent).toContain('Colour · 25%');
    expect(segs(el)[0].classList).toContain('dim');
    segs(el)[1].dispatchEvent(new Event('pointerleave'));
    f.detectChanges();
    expect(segs(el)[0].classList).not.toContain('dim');
  });

  it('puts projected content in the middle and can hide the legend', () => {
    const { f, el } = setup();
    const own = f.nativeElement.querySelector('k-donut.own') as HTMLElement;
    expect(own.querySelector('.mid .mine')).not.toBeNull();
    f.componentInstance.legend.set(false);
    f.detectChanges();
    expect(el.querySelector('.legend')).toBeNull();
  });

  it('draws one whole ring for a single slice and nothing broken for zeros or negatives', () => {
    const { f, el } = setup();
    f.componentInstance.items.set([{ label: 'Only', value: 5 }]);
    f.detectChanges();
    expect(segs(el)[0].style.strokeDasharray).toBe('100 0');
    f.componentInstance.items.set([{ label: 'A', value: 0 }, { label: 'B', value: -3 }]);
    f.detectChanges();
    expect(el.textContent).not.toMatch(/NaN|Infinity/);
    expect(el.querySelector('.legend')!.textContent).toContain('0%');
  });
});
