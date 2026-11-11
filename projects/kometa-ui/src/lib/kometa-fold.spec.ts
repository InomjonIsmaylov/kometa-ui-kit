import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { KometaFold, KometaFoldBody, KometaFoldMark } from './kometa-fold';

@Component({
  imports: [KometaFold],
  template: `
    <kometa-fold [(open)]="open">
      <span fold-title>Dushanba</span>
      <ng-template><p class="made">{{ built() }}</p></ng-template>
    </kometa-fold>
  `,
})
class Host {
  open = signal(false);
  made = 0;
  built() { this.made++; return 'body'; }
}

@Component({
  imports: [KometaFoldBody, KometaFoldMark],
  template: `<kometa-fold-mark [open]="open()" /><kometa-fold-body [open]="open()"><ng-template><i class="b">x</i></ng-template></kometa-fold-body>`,
})
class Bare {
  open = signal(false);
}

function setup<T>(type: new () => T) {
  const f = TestBed.createComponent(type);
  f.detectChanges();
  return f;
}
const q = (f: { nativeElement: HTMLElement }, sel: string) => f.nativeElement.querySelector(sel) as HTMLElement | null;
const phase = (f: { nativeElement: HTMLElement }, tag = 'kometa-fold-body') => q(f, tag)!.getAttribute('data-phase');
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

afterEach(() => vi.unstubAllGlobals());

describe('KometaFold', () => {
  it('is a real button with aria-expanded and aria-controls, and the body is a labelled region', () => {
    const f = setup(Host);
    const btn = q(f, 'button.trigger')!;
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    const region = q(f, '[role="region"]')!;
    expect(btn.getAttribute('aria-controls')).toBe(region.id);
    expect(region.getAttribute('aria-labelledby')).toBe(btn.id);
    expect(btn.textContent).toContain('Dushanba');
  });

  it('creates its body only while open, and flips aria-expanded with the model', async () => {
    const f = setup(Host);
    expect(q(f, '.made')).toBeNull();
    expect(phase(f)).toBe('closed');
    q(f, 'button.trigger')!.click();
    f.detectChanges();
    expect(f.componentInstance.open()).toBe(true);
    expect(q(f, 'button.trigger')!.getAttribute('aria-expanded')).toBe('true');
    expect(q(f, '.made')!.textContent).toBe('body');
    expect(phase(f)).toBe('opening');
    await wait(480);
    f.detectChanges();
    expect(phase(f)).toBe('open');
  });

  it('keeps the body through the 260ms close and then drops it', async () => {
    const f = setup(Host);
    f.componentInstance.open.set(true);
    f.detectChanges();
    await wait(480);
    f.componentInstance.open.set(false);
    f.detectChanges();
    expect(phase(f)).toBe('closing');
    expect(q(f, '.made')).not.toBeNull();
    await wait(320);
    f.detectChanges();
    expect(phase(f)).toBe('closed');
    expect(q(f, '.made')).toBeNull();
  });

  it('is instant under prefers-reduced-motion', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce'), media: query }));
    const f = setup(Host);
    f.componentInstance.open.set(true);
    f.detectChanges();
    expect(phase(f)).toBe('open');
    f.componentInstance.open.set(false);
    f.detectChanges();
    expect(phase(f)).toBe('closed');
    expect(q(f, '.made')).toBeNull();
  });

  it('starts open without animating, so a page that loads open does not stir', () => {
    const f = TestBed.createComponent(Host);
    f.componentInstance.open.set(true);
    f.detectChanges();
    expect(phase(f)).toBe('open');
    expect(q(f, '.made')).not.toBeNull();
  });
});

describe('the parts on their own', () => {
  it('draws the mark with two hairlines and no chevron: the vertical one scales away when open', () => {
    const f = setup(Bare);
    const mark = q(f, 'kometa-fold-mark')!;
    expect(mark.getAttribute('aria-hidden')).toBe('true');
    expect(mark.querySelector('svg')).toBeNull();
    expect(mark.classList.contains('open')).toBe(false);
    f.componentInstance.open.set(true);
    f.detectChanges();
    expect(mark.classList.contains('open')).toBe(true);
    const css = stylesheet();
    expect(css).toContain('scaleY(0)');
    expect(css).toContain('1.5px');
    expect(css).toContain('var(--display-ink');
    expect(css).toContain('prefers-reduced-motion');
  });

  it('opens by animating grid rows 0fr to 1fr over 420ms and closes in 260ms', () => {
    setup(Bare);
    const css = stylesheet();
    expect(css).toMatch(/from\s*\{\s*grid-template-rows:\s*0fr;\s*\}\s*to\s*\{\s*grid-template-rows:\s*1fr;/);
    expect(css).toContain('420ms var(--ease-spring');
    expect(css).toContain('260ms cubic-bezier(0.32, 0, 0.22, 1)');
    expect(css).toContain('translateY(4px)');
    expect(css).not.toMatch(/height:\s*auto/);
  });

  it('can appear: created already open, it animates in', () => {
    @Component({ imports: [KometaFoldBody], template: `<kometa-fold-body [open]="true" [appear]="true"><ng-template>hi</ng-template></kometa-fold-body>` })
    class Appear {}
    const f = setup(Appear);
    expect(phase(f)).toBe('opening');
    expect(f.nativeElement.textContent).toContain('hi');
  });
});

function stylesheet(): string {
  return [...document.querySelectorAll('style')].map((s) => s.textContent ?? '').join('\n');
}
