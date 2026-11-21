import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaSpark } from './kometa-spark';

@Component({
  imports: [KometaSpark],
  template: `<k-spark [values]="values()" [label]="label()" [color]="color()" [fill]="fill()" />`,
})
class Host {
  values = signal<number[]>([3, 5, 4, 8]);
  label = signal('');
  color = signal('');
  fill = signal(true);
}

function setup() {
  const f = TestBed.createComponent(Host);
  f.detectChanges();
  return { f, el: f.nativeElement.querySelector('k-spark') as HTMLElement };
}

describe('KometaSpark', () => {
  it('draws a line from the first value to the last, a fill under it and a dot on the latest value', () => {
    const { el } = setup();
    const line = el.querySelector('.line')!.getAttribute('d')!;
    expect(line.startsWith('M0 ')).toBe(true);
    expect(line).toContain('L100 2');
    expect(el.querySelector('.area')!.getAttribute('d')).toMatch(/Z$/);
    expect((el.querySelector('.dot') as HTMLElement).style.bottom).toBe('93.75%');
  });

  it('is decoration without a label and a named image with one', () => {
    const { f, el } = setup();
    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.getAttribute('role')).toBeNull();
    f.componentInstance.label.set('Visits, from 3 to 8');
    f.detectChanges();
    expect(el.getAttribute('role')).toBe('img');
    expect(el.getAttribute('aria-label')).toBe('Visits, from 3 to 8');
    expect(el.getAttribute('aria-hidden')).toBeNull();
  });

  it('takes a colour and can leave the fill out', () => {
    const { f, el } = setup();
    f.componentInstance.color.set('var(--green)');
    f.componentInstance.fill.set(false);
    f.detectChanges();
    expect(el.style.getPropertyValue('--spark-color')).toBe('var(--green)');
    expect(el.querySelector('.area')).toBeNull();
  });

  it('draws nothing broken for no values, all zeros or a stray NaN', () => {
    const { f, el } = setup();
    for (const v of [[], [0, 0, 0], [2, NaN, 4], [5]]) {
      f.componentInstance.values.set(v);
      f.detectChanges();
      expect(el.querySelector('.line')!.getAttribute('d') ?? '').not.toMatch(/NaN|Infinity/);
    }
    f.componentInstance.values.set([]);
    f.detectChanges();
    expect(el.querySelector('.dot')).toBeNull();
  });
});
