import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaHue, hexToHue, hslToHex } from './kometa-hue';

@Component({
  imports: [KometaHue],
  template: `<k-hue [(value)]="value" [count]="count()" ariaLabel="Shop colour" [disabled]="off()" />`,
})
class Host {
  value = signal(hslToHex(120, 75, 62));
  count = signal(24);
  off = signal(false);
}

describe('hue helpers', () => {
  it('converts HSL to hex and back to the hue', () => {
    expect(hslToHex(0, 100, 50)).toBe('#FF0000');
    expect(hslToHex(120, 100, 50)).toBe('#00FF00');
    expect(hslToHex(240, 100, 50)).toBe('#0000FF');
    expect(hexToHue('#00FF00')).toBeCloseTo(120);
    expect(hexToHue('#0000ff')).toBeCloseTo(240);
    expect(hexToHue('#808080')).toBe(0);
    expect(hexToHue('nonsense')).toBe(0);
  });
});

describe('KometaHue', () => {
  function render() {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const el = f.nativeElement.querySelector('k-hue') as HTMLElement;
    const rail = el.querySelector('[role="slider"]') as HTMLElement;
    const press = (key: string) => {
      rail.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
      f.detectChanges();
    };
    return { f, el, rail, press };
  }

  it('draws one tick per hue in its own colour and stands the chosen one up', () => {
    const { el, rail } = render();
    const ticks = el.querySelectorAll<HTMLElement>('.ticks i');
    expect(ticks.length).toBe(24);
    expect(ticks[8].classList.contains('on')).toBe(true);
    expect(rail.getAttribute('aria-valuenow')).toBe('8');
    expect(rail.getAttribute('aria-valuetext')).toBe(hslToHex(120, 75, 62));
    expect(el.querySelector('.hex')!.textContent).toBe(hslToHex(120, 75, 62));
  });

  it('steps through the hues with the keys', () => {
    const { f, press } = render();
    press('ArrowRight');
    expect(f.componentInstance.value()).toBe(hslToHex(135, 75, 62));
    press('Home');
    expect(f.componentInstance.value()).toBe(hslToHex(0, 75, 62));
    press('End');
    press('ArrowRight');
    expect(f.componentInstance.value()).toBe(hslToHex(345, 75, 62));
  });

  it('picks the hue under the pointer', () => {
    const { f, rail } = render();
    rail.getBoundingClientRect = () => ({ left: 0, width: 240 }) as DOMRect;
    rail.dispatchEvent(Object.assign(new MouseEvent('pointerdown', { clientX: 125, bubbles: true }), { pointerId: 1 }));
    expect(f.componentInstance.value()).toBe(hslToHex(180, 75, 62));
  });

  it('ignores keys when disabled', () => {
    const { f, rail, press } = render();
    f.componentInstance.off.set(true);
    f.detectChanges();
    press('ArrowRight');
    expect(f.componentInstance.value()).toBe(hslToHex(120, 75, 62));
    expect(rail.getAttribute('tabindex')).toBe('-1');
  });
});
