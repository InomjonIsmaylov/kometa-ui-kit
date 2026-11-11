import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaSkeleton } from './kometa-skeleton';

@Component({
  imports: [KometaSkeleton],
  template: `<kometa-skeleton [rows]="rows()" [shape]="shape()" [width]="width()" [delay]="delay()" ariaLabel="Yuklanmoqda" />`,
})
class Host {
  rows = signal(3);
  shape = signal<'rows' | 'card' | 'line'>('rows');
  width = signal('100%');
  delay = signal(0);
}

describe('KometaSkeleton', () => {
  function render() {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const el = () => f.nativeElement.querySelector('kometa-skeleton') as HTMLElement;
    return { f, el };
  }

  it('draws one hairline for a table cell, at the given width and delay, silent to a screen reader', () => {
    const { f, el } = render();
    f.componentInstance.shape.set('line');
    f.componentInstance.width.set('72%');
    f.componentInstance.delay.set(140);
    f.detectChanges();
    const glint = el().querySelector('.glint') as HTMLElement;
    expect(el().querySelectorAll('.glint').length).toBe(1);
    expect(el().querySelector('.r, .card')).toBeNull();
    expect(glint.style.width).toBe('72%');
    expect(glint.style.getPropertyValue('--d')).toBe('140ms');
    expect(el().getAttribute('data-shape')).toBe('line');
    expect(el().hasAttribute('role')).toBe(false);
    expect(el().hasAttribute('aria-busy')).toBe(false);
    expect(el().hasAttribute('aria-label')).toBe(false);
    expect(el().getAttribute('aria-hidden')).toBe('true');
  });

  it('is a busy status with the caller label', () => {
    const { el } = render();
    expect(el().getAttribute('role')).toBe('status');
    expect(el().getAttribute('aria-busy')).toBe('true');
    expect(el().getAttribute('aria-label')).toBe('Yuklanmoqda');
  });

  it('draws three list rows of a disc and two hairlines by default', () => {
    const { el } = render();
    expect(el().querySelectorAll('.r').length).toBe(3);
    expect(el().querySelectorAll('.disc').length).toBe(3);
    expect(el().querySelectorAll('.r:first-child .l').length).toBe(2);
  });

  it('follows the rows input', () => {
    const { f, el } = render();
    f.componentInstance.rows.set(5);
    f.detectChanges();
    expect(el().querySelectorAll('.r').length).toBe(5);
    f.componentInstance.rows.set(0);
    f.detectChanges();
    expect(el().querySelectorAll('.r').length).toBe(0);
  });

  it('staggers the rows by 200ms', () => {
    const { el } = render();
    const delays = [...el().querySelectorAll<HTMLElement>('.r')].map((r) =>
      (r.querySelector('.l') as HTMLElement).style.getPropertyValue('--d'),
    );
    expect(delays).toEqual(['0s', '0.2s', '0.4s']);
  });

  it('draws one bordered frame with three lines for the card shape', () => {
    const { f, el } = render();
    f.componentInstance.shape.set('card');
    f.detectChanges();
    expect(el().querySelectorAll('.card').length).toBe(1);
    expect(el().querySelectorAll('.card .l').length).toBe(3);
    expect(el().querySelector('.disc')).toBeNull();
    expect(stylesheet(KometaSkeleton)).toContain('var(--glass-line');
  });

  it('draws the lines as hairlines with a scaleX keyframe and no grey block fill', () => {
    render();
    const css = stylesheet(KometaSkeleton);
    expect(css).toContain('@keyframes');
    expect(css).toContain('scaleX(0)');
    expect(css).toContain('1.8s');
    expect(css).toContain('height: 1px');
    expect(css).not.toContain('var(--skel');
  });

  it('uses tokens and only fallback hex colours', () => {
    render();
    const css = stylesheet(KometaSkeleton);
    const bare = css.replace(/var\([^()]*(?:\([^()]*\)[^()]*)*\)/g, '');
    expect(bare).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  it('leaves the hairlines fully drawn under reduced motion', () => {
    render();
    const css = stylesheet(KometaSkeleton);
    expect(css).toContain('prefers-reduced-motion');
    expect(css).toContain('animation: none');
  });

  it('holds no text of its own', () => {
    const { el } = render();
    expect(el().textContent?.trim()).toBe('');
  });
});

function stylesheet(component: unknown): string {
  const def = (component as { ɵcmp?: { styles?: string[] | string } }).ɵcmp;
  const fromDef = def?.styles == null ? '' : Array.isArray(def.styles) ? def.styles.join('\n') : String(def.styles);
  const fromDoc = [...document.querySelectorAll('style')].map((s) => s.textContent ?? '').join('\n');
  return `${fromDef}\n${fromDoc}`;
}

describe('KometaSkeleton row options', () => {
  it('avatar=false drops the disc and lines sets the hairlines per row', () => {
    @Component({ imports: [KometaSkeleton], template: `<kometa-skeleton [rows]="2" [avatar]="false" [lines]="3" />` })
    class H {}
    const f = TestBed.createComponent(H);
    f.detectChanges();
    const el = f.nativeElement as HTMLElement;
    expect(el.querySelector('.disc')).toBeNull();
    expect(el.querySelectorAll('.r').length).toBe(2);
    expect(el.querySelectorAll('.l').length).toBe(6);
  });
});
