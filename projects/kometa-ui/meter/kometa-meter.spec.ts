import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { KometaMeter } from './kometa-meter';

@Component({
  imports: [KometaMeter],
  template: `<k-meter [value]="value()" [max]="max()" label="bepul lid qoldi" ariaLabel="Lidlar" />`,
})
class Host {
  value = signal(17);
  max = signal(25);
}

describe('KometaMeter', () => {
  function render() {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const el = f.nativeElement.querySelector('k-meter') as HTMLElement;
    const ticks = () => Array.from(el.querySelectorAll('.ticks i')) as HTMLElement[];
    const bright = () => ticks().filter((t) => t.classList.contains('on')).length;
    return { f, el, ticks, bright };
  }
  const fig = (el: HTMLElement) => el.querySelector('.fig')!.textContent!.replace(/\s+/g, ' ').trim();

  it('shows the exact figure over one tick per unit', () => {
    const { el, ticks, bright } = render();
    expect(fig(el)).toBe('17 / 25');
    expect(ticks().length).toBe(25);
    expect(bright()).toBe(17);
    expect(ticks()[16].classList.contains('on')).toBe(true);
    expect(ticks()[17].classList.contains('on')).toBe(false);
  });

  it('shows the callers label under the ticks and nothing when it is empty', () => {
    const { el } = render();
    expect(el.querySelector('.note')!.textContent).toBe('bepul lid qoldi');
    const bare = TestBed.createComponent(KometaMeter);
    bare.detectChanges();
    expect((bare.nativeElement as HTMLElement).querySelector('.note')).toBeNull();
  });

  it('dims a spent tick as the value falls', () => {
    const { f, bright } = render();
    f.componentInstance.value.set(3);
    f.detectChanges();
    expect(bright()).toBe(3);
  });

  it('draws 25 scaled ticks above 40 units and keeps the figure exact', () => {
    const { f, el, ticks, bright } = render();
    f.componentInstance.max.set(100);
    f.componentInstance.value.set(50);
    f.detectChanges();
    expect(ticks().length).toBe(25);
    expect(bright()).toBe(13);
    expect(fig(el)).toBe('50 / 100');
  });

  it('draws every tick up to 40 units', () => {
    const { f, ticks } = render();
    f.componentInstance.max.set(40);
    f.detectChanges();
    expect(ticks().length).toBe(40);
  });

  it('clamps the value into range', () => {
    const { f, el, ticks } = render();
    f.componentInstance.value.set(99);
    f.detectChanges();
    expect(ticks().every((t) => t.classList.contains('on'))).toBe(true);
    f.componentInstance.value.set(-4);
    f.detectChanges();
    expect(el.querySelector('[role="meter"]')!.getAttribute('aria-valuenow')).toBe('0');
  });

  it('renders role meter with the values and text from the label', () => {
    const { el } = render();
    const m = el.querySelector('[role="meter"]')!;
    expect(m.getAttribute('aria-valuenow')).toBe('17');
    expect(m.getAttribute('aria-valuemin')).toBe('0');
    expect(m.getAttribute('aria-valuemax')).toBe('25');
    expect(m.getAttribute('aria-valuetext')).toBe('17 / 25 bepul lid qoldi');
    expect(m.getAttribute('aria-label')).toBe('Lidlar');
    expect(el.querySelector('.ticks')!.getAttribute('aria-hidden')).toBe('true');
    expect(el.querySelector('button, input')).toBeNull();
  });

  it('rolls the figure after a change but not on mount', () => {
    const { f, el } = render();
    const m = el.querySelector('[role="meter"]')!;
    expect(m.classList.contains('rolled')).toBe(false);
    const before = el.querySelector('.fig b');
    const warn = vi.spyOn(console, 'warn');
    f.componentInstance.value.set(16);
    f.detectChanges();
    expect(m.classList.contains('rolled')).toBe(true);
    // A fresh <b> replays the CSS roll; NG0956 is Angular's warning for track-by-identity recreating it.
    expect(el.querySelector('.fig b')).not.toBe(before);
    expect(warn.mock.calls.flat().join(' ')).not.toContain('NG0956');
    warn.mockRestore();
  });

  it('removes the roll and the tick transition under reduced motion', () => {
    const css = stylesheet(KometaMeter);
    expect(css).toMatch(/prefers-reduced-motion: reduce\)[\s\S]*animation: none/);
    expect(css).toMatch(/prefers-reduced-motion: reduce\)[\s\S]*transition: none/);
  });

  it('uses tokens and no colour literals', () => {
    const css = stylesheet(KometaMeter);
    for (const t of ['var(--display-ink', 'var(--glass-line)', 'var(--muted)', 'var(--font-display', 'var(--ease-spring']) {
      expect(css).toContain(t);
    }
    expect(css.replace(/var\([^)]*\)/g, '')).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});

function stylesheet(component: unknown): string {
  const def = (component as { ɵcmp?: { styles?: string[] | string } }).ɵcmp;
  const fromDef = def?.styles == null ? '' : Array.isArray(def.styles) ? def.styles.join('\n') : String(def.styles);
  return fromDef.replace(/%NS%/g, '').replace(/\[_ng(?:content|host)-[^\]]*\]/g, '');
}

describe('KometaMeter figure size', () => {
  it('sizes the "/ max" part relative to --meter-figure-size', () => {
    const css = String((KometaMeter as unknown as { ɵcmp: { styles: string[] } }).ɵcmp.styles);
    expect(css).toMatch(/\.fig\S*\s+span[^{]*\{[^}]*font-size: 0?\.5625em/);
  });
});
