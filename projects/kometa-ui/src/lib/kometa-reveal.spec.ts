import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaReveal } from './kometa-reveal';

@Component({
  imports: [KometaReveal],
  template: `<kometa-reveal before="/b.webp" after="/a.webp" beforeLabel="Before" afterLabel="After" ariaLabel="Before and after" [(position)]="pos" />`,
})
class Host {
  pos = signal(50);
}

describe('KometaReveal', () => {
  function render() {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const root = f.nativeElement.querySelector('kometa-reveal') as HTMLElement;
    const ticks = root.querySelector('.ticks') as HTMLElement;
    const key = (k: string, shiftKey = false) => {
      const e = new KeyboardEvent('keydown', { key: k, shiftKey, bubbles: true, cancelable: true });
      ticks.dispatchEvent(e);
      f.detectChanges();
      return e;
    };
    const rect = (el: HTMLElement) => { el.getBoundingClientRect = () => ({ left: 100, width: 200, right: 300, top: 0, bottom: 0, height: 0, x: 100, y: 0, toJSON: () => '' }); };
    const press = (el: HTMLElement, clientX: number, type = 'pointerdown') => {
      el.dispatchEvent(Object.assign(new Event(type, { bubbles: true }), { clientX, pointerId: 1 }));
      f.detectChanges();
    };
    return { f, root, ticks, key, rect, press };
  }

  it('draws both photos with their words, the after one clipped by the position', () => {
    const { root } = render();
    const imgs = [...root.querySelectorAll('img')];
    expect(imgs.map((i) => [i.getAttribute('src'), i.getAttribute('alt')])).toEqual([['/b.webp', 'Before'], ['/a.webp', 'After']]);
    expect(root.style.getPropertyValue('--p')).toBe('50%');
    const css = (KometaReveal as unknown as { ɵcmp: { styles: string[] } }).ɵcmp.styles.join('\n');
    expect(css).toMatch(/\.after[^{]*\{[^}]*clip-path:\s*inset\(0 0 0 var\(--[^)]*p\)\)/);
  });

  it('is a slider named by the caller, with the position as its value in words', () => {
    const { ticks } = render();
    expect(ticks.getAttribute('role')).toBe('slider');
    expect(ticks.getAttribute('aria-label')).toBe('Before and after');
    expect(ticks.getAttribute('aria-valuenow')).toBe('50');
    expect(ticks.getAttribute('aria-valuetext')).toBe('Before 50%, After 50%');
    expect(ticks.tabIndex).toBe(0);
  });

  it('lights the ticks up to the line and makes the one under it tall', () => {
    const { ticks } = render();
    const all = [...ticks.querySelectorAll('i')];
    expect(all.length).toBe(21);
    expect(all.filter((t) => t.classList.contains('on')).length).toBe(11);
    expect(all[10].classList.contains('cur')).toBe(true);
    expect(all.filter((t) => t.classList.contains('cur')).length).toBe(1);
  });

  it('steps by five with the arrows, by twenty with Shift, and stops at both ends', () => {
    const { f, key } = render();
    key('ArrowRight');
    expect(f.componentInstance.pos()).toBe(55);
    key('ArrowLeft', true);
    expect(f.componentInstance.pos()).toBe(35);
    key('Home');
    expect(f.componentInstance.pos()).toBe(0);
    key('ArrowLeft');
    expect(f.componentInstance.pos()).toBe(0);
    key('End');
    expect(f.componentInstance.pos()).toBe(100);
    expect(key('a').defaultPrevented).toBe(false);
  });

  it('follows a press and a drag along the ticks, snapped to the nearest tick', () => {
    const { f, ticks, rect, press } = render();
    rect(ticks);
    press(ticks, 100 + 200 * 0.26);
    expect(f.componentInstance.pos()).toBe(25);
    press(ticks, 100 + 200 * 0.9, 'pointermove');
    expect(f.componentInstance.pos()).toBe(90);
    press(ticks, 0, 'pointerup');
    press(ticks, 100 + 200 * 0.1, 'pointermove');
    expect(f.componentInstance.pos()).toBe(90);
  });

  it('can also be dragged across the photo', () => {
    const { f, root, rect, press } = render();
    const frame = root.querySelector('.frame') as HTMLElement;
    rect(frame);
    press(frame, 100 + 200 * 0.75);
    expect(f.componentInstance.pos()).toBe(75);
  });
});
