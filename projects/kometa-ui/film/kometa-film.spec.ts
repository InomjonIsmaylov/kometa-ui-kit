import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaFilm } from './kometa-film';

@Component({
  imports: [KometaFilm],
  template: `<k-film [days]="days()" [(value)]="value" [ariaLabel]="ariaLabel()" />`,
})
class Host {
  days = signal([
    { value: '2026-10-12', label: '12', sub: 'Du', dot: true },
    { value: '2026-10-13', label: '13', sub: 'Se', muted: true },
    { value: '2026-10-14', label: '14', sub: 'Ch' },
  ]);
  value = signal('');
  ariaLabel = signal('Hafta');
}

describe('KometaFilm', () => {
  function render() {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const root = f.nativeElement.querySelector('k-film') as HTMLElement;
    const buttons = [...root.querySelectorAll('button')] as HTMLButtonElement[];
    return { f, root, buttons };
  }

  it('renders a button per day, with its weekday and an aria-hidden dot', () => {
    const { root, buttons } = render();
    expect(buttons.length).toBe(3);
    expect(buttons[0].textContent).toContain('12');
    expect(buttons[0].querySelector('small')?.textContent).toBe('Du');
    expect(buttons[0].querySelector('.dot')?.getAttribute('aria-hidden')).toBe('true');
    expect(buttons[1].querySelector('.dot')).toBeNull();
    expect(buttons[1].hasAttribute('data-muted')).toBe(true);
    expect(root.getAttribute('role')).toBe('group');
    expect(root.getAttribute('aria-label')).toBe('Hafta');
    expect(buttons.every((b) => b.getAttribute('aria-pressed') === 'false')).toBe(true);
  });

  it('presses the selected value', () => {
    const { f, buttons } = render();
    f.componentInstance.value.set('2026-10-13');
    f.detectChanges();
    expect(buttons.map((b) => b.getAttribute('aria-pressed'))).toEqual(['false', 'true', 'false']);
  });

  it('sets the value when a day is clicked', () => {
    const { f, buttons } = render();
    buttons[2].click();
    f.detectChanges();
    expect(f.componentInstance.value()).toBe('2026-10-14');
    expect(buttons[2].getAttribute('aria-pressed')).toBe('true');
  });

  it('slides the glass thumb to the pressed day', () => {
    const { f, root, buttons } = render();
    const thumb = root.querySelector('.film-thumb') as HTMLElement;
    expect(thumb).not.toBeNull();
    stubBox(buttons[1], 48, 52);
    buttons[1].click();
    f.detectChanges();
    expect(thumb.style.transform).toContain('48');
    expect(thumb.style.width).toBe('52px');
  });

  it('measures the pressed day again on render', () => {
    const { f, root, buttons } = render();
    f.componentInstance.value.set('2026-10-14');
    f.detectChanges();
    stubBox(buttons[2], 90, 40);
    f.componentInstance.days.set([...f.componentInstance.days()]);
    f.detectChanges();
    const thumb = root.querySelector('.film-thumb') as HTMLElement;
    expect(thumb.style.transform).toContain('90');
    expect(thumb.style.width).toBe('40px');
  });

  it('drops the thumb transition under reduced motion', () => {
    const css = (KometaFilm as unknown as { ɵcmp: { styles: string[] } }).ɵcmp.styles.join('');
    expect(css).toMatch(/prefers-reduced-motion:\s*reduce\)\s*\{\s*\.film-thumb[^{]*\{\s*transition:\s*none/);
  });
});

function stubBox(el: HTMLElement, left: number, width: number) {
  Object.defineProperty(el, 'offsetLeft', { configurable: true, value: left });
  Object.defineProperty(el, 'offsetWidth', { configurable: true, value: width });
}
