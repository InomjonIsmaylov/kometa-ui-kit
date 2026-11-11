import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, vi } from 'vitest';
import { KometaAccordion, KometaAccordionItem } from './kometa-accordion';

@Component({
  imports: [KometaAccordion, KometaAccordionItem],
  template: `
    <k-accordion [multiple]="multiple()">
      <k-accordion-item heading="Lid to'lovi nima?" [(open)]="first">Birinchi javob.</k-accordion-item>
      <k-accordion-item heading="Havola pullikmi?">Ikkinchi javob.</k-accordion-item>
      <k-accordion-item heading="Qanday bekor qilaman? Juda uzun savol, ruscha va oʻzbekcha, bir necha qatorga oʻralishi kerak.">Uchinchi javob.</k-accordion-item>
    </k-accordion>
  `,
})
class Host {
  multiple = signal(false);
  first = signal(false);
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
afterEach(() => vi.unstubAllGlobals());

describe('KometaAccordion', () => {
  function render() {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const q = () => [...f.nativeElement.querySelectorAll('button.q')] as HTMLButtonElement[];
    const open = () => q().map((b) => b.getAttribute('aria-expanded'));
    return { f, q, open };
  }

  it('renders one real button per question inside a heading with the caller words', () => {
    const { f, q } = render();
    expect(q().length).toBe(3);
    expect(q()[0].textContent).toContain("Lid to'lovi nima?");
    expect(f.nativeElement.querySelectorAll('[role="heading"]').length).toBe(3);
    expect(f.nativeElement.querySelector('[role="heading"]').getAttribute('aria-level')).toBe('3');
  });

  it('starts closed with aria-expanded false and no answer in the DOM', () => {
    const { f, open } = render();
    expect(open()).toEqual(['false', 'false', 'false']);
    expect(f.nativeElement.textContent).not.toContain('Birinchi javob.');
  });

  it('wires aria-controls to a labelled region', () => {
    const { f, q } = render();
    const region = f.nativeElement.querySelector('[role="region"]') as HTMLElement;
    expect(q()[0].getAttribute('aria-controls')).toBe(region.id);
    expect(region.getAttribute('aria-labelledby')).toBe(q()[0].id);
  });

  it('opens the answer on click and shows the projected text', () => {
    const { f, q, open } = render();
    q()[0].click();
    f.detectChanges();
    expect(open()).toEqual(['true', 'false', 'false']);
    expect(f.nativeElement.textContent).toContain('Birinchi javob.');
    expect(f.nativeElement.querySelector('k-accordion-item').classList.contains('open')).toBe(true);
  });

  it('closes the open one when another opens by default', () => {
    const { f, q, open } = render();
    q()[0].click();
    f.detectChanges();
    q()[1].click();
    f.detectChanges();
    f.detectChanges();
    expect(open()).toEqual(['false', 'true', 'false']);
    expect(f.componentInstance.first()).toBe(false);
  });

  it('keeps several open with multiple', () => {
    const { f, q, open } = render();
    f.componentInstance.multiple.set(true);
    f.detectChanges();
    q()[0].click();
    f.detectChanges();
    q()[2].click();
    f.detectChanges();
    f.detectChanges();
    expect(open()).toEqual(['true', 'false', 'true']);
  });

  it('toggles an item shut on a second click and drives the open model', () => {
    const { f, q } = render();
    q()[0].click();
    f.detectChanges();
    expect(f.componentInstance.first()).toBe(true);
    q()[0].click();
    f.detectChanges();
    expect(f.componentInstance.first()).toBe(false);
  });

  it('opens an item from its model', () => {
    const { f, open } = render();
    f.componentInstance.first.set(true);
    f.detectChanges();
    expect(open()[0]).toBe('true');
  });

  it('moves focus with the arrow keys and wraps, and Home and End jump', () => {
    const { f, q } = render();
    const press = (key: string) => {
      (document.activeElement as HTMLElement).dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    };
    document.body.appendChild(f.nativeElement);
    q()[0].focus();
    press('ArrowDown');
    expect(document.activeElement).toBe(q()[1]);
    press('End');
    expect(document.activeElement).toBe(q()[2]);
    press('ArrowDown');
    expect(document.activeElement).toBe(q()[0]);
    press('ArrowUp');
    expect(document.activeElement).toBe(q()[2]);
    press('Home');
    expect(document.activeElement).toBe(q()[0]);
    f.nativeElement.remove();
  });

  it('opens through the fold body spring and is instant under reduced motion', async () => {
    const { f, q } = render();
    q()[0].click();
    f.detectChanges();
    expect(f.nativeElement.querySelector('k-fold-body').getAttribute('data-phase')).toBe('opening');
    await wait(480);
    f.detectChanges();
    expect(f.nativeElement.querySelector('k-fold-body').getAttribute('data-phase')).toBe('open');

    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce'), media: query }));
    const g = TestBed.createComponent(Host);
    g.detectChanges();
    (g.nativeElement.querySelector('button.q') as HTMLButtonElement).click();
    g.detectChanges();
    expect(g.nativeElement.querySelector('k-fold-body').getAttribute('data-phase')).toBe('open');
  });

  it('stretches a hairline from scaleX .18 at .3 opacity to full when open over 680ms', () => {
    render();
    const css = stylesheet(KometaAccordionItem);
    expect(css).toContain('scaleX(0.18)');
    expect(css).toContain('opacity: 0.3');
    expect(css).toMatch(/\.open::after \{ transform: scaleX\(1\); opacity: 1; \}/);
    expect(css).toContain('680ms cubic-bezier(0.22, 1.35, 0.32, 1)');
  });

  it('sets the question in Syne and lets it wrap without truncation', () => {
    render();
    const css = stylesheet(KometaAccordionItem);
    expect(css).toContain('var(--font-display');
    expect(css).toContain('overflow-wrap: break-word');
    expect(css).not.toContain('ellipsis');
    expect(css).not.toMatch(/white-space:\s*nowrap/);
  });

  it('has a focus ring and tokens rather than colour literals and drops motion under prefers-reduced-motion', () => {
    render();
    const css = stylesheet(KometaAccordionItem);
    expect(css).toContain('outline: 2px solid var(--amber)');
    expect(css).toContain('var(--muted)');
    expect(css).not.toMatch(/(?<!var\(--display-ink, )#[0-9a-fA-F]{3,8}\b/);
    expect(css).toMatch(/prefers-reduced-motion: reduce\)\s*\{[^}]*transition: none/);
  });
});

function stylesheet(component: unknown): string {
  const def = (component as { ɵcmp?: { styles?: string[] | string } }).ɵcmp;
  const css = def?.styles == null ? '' : Array.isArray(def.styles) ? def.styles.join(' ') : String(def.styles);
  // Only this component's own rules, whitespace collapsed and the emulated-encapsulation attributes removed.
  return css.replaceAll('%NS%', '').replace(/\[_ng(?:content|host)-[^\]]*\]/g, '').replace(/\s+/g, ' ');
}
