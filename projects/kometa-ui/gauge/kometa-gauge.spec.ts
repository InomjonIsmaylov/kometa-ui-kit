import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaGauge } from './kometa-gauge';

@Component({
  imports: [KometaGauge],
  template: `<k-gauge [value]="value()" [max]="max()" label="7 of 9 slots booked" />
             <k-gauge class="own" [value]="3" label="Three"><span class="face">3</span></k-gauge>`,
})
class Host {
  value = signal(7);
  max = signal(9);
}

function setup() {
  const f = TestBed.createComponent(Host);
  f.detectChanges();
  return { f, el: f.nativeElement.querySelector('k-gauge') as HTMLElement };
}
const dash = (el: HTMLElement) => (el.querySelector('.fill') as SVGElement).style.strokeDasharray;

describe('KometaGauge', () => {
  it('is an image named by its label and shows the rounded percentage', () => {
    const { el } = setup();
    expect(el.getAttribute('role')).toBe('img');
    expect(el.getAttribute('aria-label')).toBe('7 of 9 slots booked');
    expect(el.querySelector('.pct')!.textContent!.replace(/\s/g, '')).toBe('78%');
    expect(dash(el)).toMatch(/^58\.33\d* 100$/);
  });

  it('stays between empty and full, and is empty for a zero max', () => {
    const { f, el } = setup();
    f.componentInstance.value.set(20);
    f.detectChanges();
    expect(el.querySelector('.pct')!.textContent).toContain('100');
    f.componentInstance.value.set(-4);
    f.detectChanges();
    expect(el.querySelector('.pct')!.textContent).toContain('0');
    f.componentInstance.max.set(0);
    f.componentInstance.value.set(5);
    f.detectChanges();
    expect(dash(el)).toBe('0 100');
  });

  it('shows projected content in place of the percentage', () => {
    const { f } = setup();
    const own = f.nativeElement.querySelector('k-gauge.own') as HTMLElement;
    expect(own.querySelector('.mid .face')!.textContent).toBe('3');
    expect(own.querySelector('.pct')).toBeNull();
  });
});
