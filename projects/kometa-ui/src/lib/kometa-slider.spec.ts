import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaSlider } from './kometa-slider';

@Component({
  imports: [KometaSlider],
  template: `<k-slider [(value)]="value" [max]="max()" [step]="step()" unit="km" ariaLabel="Distance" [disabled]="off()" />`,
})
class Host {
  value = signal(12);
  max = signal(20);
  step = signal(1);
  off = signal(false);
}

describe('KometaSlider', () => {
  function render() {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const el = f.nativeElement.querySelector('k-slider') as HTMLElement;
    const rail = el.querySelector('[role="slider"]') as HTMLElement;
    const lit = () => el.querySelectorAll('.ticks i.on').length;
    const press = (key: string) => {
      rail.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
      f.detectChanges();
    };
    return { f, el, rail, lit, press };
  }

  it('draws one tick per step with the value lit, and the figure', () => {
    const { el, lit } = render();
    expect(el.querySelectorAll('.ticks i').length).toBe(20);
    expect(lit()).toBe(12);
    expect(el.querySelector('.fig')!.textContent!.replace(/\s+/g, ' ').trim()).toBe('12 / 20 km');
  });

  it('is a slider with its range and text', () => {
    const { rail } = render();
    expect(rail.getAttribute('aria-valuenow')).toBe('12');
    expect(rail.getAttribute('aria-valuemin')).toBe('0');
    expect(rail.getAttribute('aria-valuemax')).toBe('20');
    expect(rail.getAttribute('aria-valuetext')).toBe('12 / 20 km');
    expect(rail.getAttribute('aria-label')).toBe('Distance');
    expect(rail.getAttribute('tabindex')).toBe('0');
  });

  it('steps with the arrows, jumps with Home/End and PageUp, and clamps', () => {
    const { f, press } = render();
    press('ArrowRight');
    expect(f.componentInstance.value()).toBe(13);
    press('ArrowDown');
    press('ArrowDown');
    expect(f.componentInstance.value()).toBe(11);
    press('PageUp');
    expect(f.componentInstance.value()).toBe(13);
    press('End');
    press('ArrowRight');
    expect(f.componentInstance.value()).toBe(20);
    press('Home');
    expect(f.componentInstance.value()).toBe(0);
  });

  it('snaps decimal steps without float noise', () => {
    const { f, press } = render();
    f.componentInstance.step.set(0.1);
    f.componentInstance.max.set(1);
    f.componentInstance.value.set(0.2);
    f.detectChanges();
    press('ArrowRight');
    expect(f.componentInstance.value()).toBe(0.3);
  });

  it('sets the value from where the pointer is along the ticks', () => {
    const { f, rail } = render();
    rail.getBoundingClientRect = () => ({ left: 100, width: 200 }) as DOMRect;
    rail.dispatchEvent(Object.assign(new MouseEvent('pointerdown', { clientX: 150, bubbles: true }), { pointerId: 1 }));
    expect(f.componentInstance.value()).toBe(5);
    rail.dispatchEvent(Object.assign(new MouseEvent('pointermove', { clientX: 400, bubbles: true }), { pointerId: 1 }));
    expect(f.componentInstance.value()).toBe(20);
    rail.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }));
    rail.dispatchEvent(Object.assign(new MouseEvent('pointermove', { clientX: 100, bubbles: true }), { pointerId: 1 }));
    expect(f.componentInstance.value()).toBe(20);
  });

  it('draws 25 scaled ticks above 40 steps', () => {
    const { f, el, lit } = render();
    f.componentInstance.max.set(100);
    f.componentInstance.value.set(50);
    f.detectChanges();
    expect(el.querySelectorAll('.ticks i').length).toBe(25);
    expect(lit()).toBe(13);
  });

  it('ignores keys and leaves the tab order when disabled', () => {
    const { f, rail, press } = render();
    f.componentInstance.off.set(true);
    f.detectChanges();
    press('ArrowRight');
    expect(f.componentInstance.value()).toBe(12);
    expect(rail.getAttribute('tabindex')).toBe('-1');
    expect(rail.getAttribute('aria-disabled')).toBe('true');
  });

  it('uses tokens and no colour literals', () => {
    const css = String((KometaSlider as unknown as { ɵcmp: { styles: string[] } }).ɵcmp.styles).replace(/%NS%/g, '');
    for (const t of ['var(--display-ink', 'var(--glass-line)', 'var(--muted)', 'var(--amber)']) expect(css).toContain(t);
    expect(css.replace(/var\([^)]*\)/g, '')).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});
