import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaSearch } from './kometa-search';

@Component({
  imports: [KometaSearch],
  template: `<k-search [(value)]="value" placeholder="Kim?" ariaLabel="Search clients" clearLabel="Clear" [size]="size()" (keydown.enter)="enters = enters + 1" />`,
})
class Host {
  value = signal('');
  size = signal<'md' | 'lg'>('md');
  enters = 0;
}

describe('KometaSearch', () => {
  function render() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('k-search') as HTMLElement;
    return { fixture, el, input: el.querySelector('input') as HTMLInputElement };
  }

  it('is a labelled type=search with the question as placeholder and no magnifier', () => {
    const { el, input } = render();
    expect(input.type).toBe('search');
    expect(input.placeholder).toBe('Kim?');
    expect(input.getAttribute('aria-label')).toBe('Search clients');
    expect(input.getAttribute('autocomplete')).toBe('off');
    expect(el.querySelector('svg')).toBeNull();
  });

  it('writes what is typed to the model, and shows the clear control only with text', () => {
    const { fixture, el, input } = render();
    expect(el.querySelector('.clear')).toBeNull();
    input.value = 'Aziz';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('Aziz');
    expect(el.querySelector('.clear')!.getAttribute('aria-label')).toBe('Clear');
  });

  it('clears on the x, and lets the bubbling input event tell the page', () => {
    const { fixture, el, input } = render();
    fixture.componentInstance.value.set('Aziz');
    fixture.detectChanges();
    let heard = 0;
    el.addEventListener('input', () => heard++);
    (el.querySelector('.clear') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('');
    expect(input.value).toBe('');
    expect(heard).toBe(1);
    expect(el.querySelector('.clear')).toBeNull();
  });

  it('lets the page hear keydown.enter on the host', () => {
    const { fixture, input } = render();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(fixture.componentInstance.enters).toBe(1);
  });

  it('opens with the cursor in the question only when asked', async () => {
    @Component({ imports: [KometaSearch], template: `<k-search ariaLabel="Q" autofocus />` })
    class Focused {}
    const fixture = TestBed.createComponent(Focused);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('input'));
    fixture.nativeElement.remove();
  });

  it('is a size lg hero on request', () => {
    const { fixture, el } = render();
    expect(el.getAttribute('data-size')).toBe('md');
    fixture.componentInstance.size.set('lg');
    fixture.detectChanges();
    expect(el.getAttribute('data-size')).toBe('lg');
  });

  it('draws no box and a hairline that grows on focus, still under reduced motion', () => {
    const css = stylesheet(KometaSearch);
    expect(css).toContain('border: 0');
    expect(css).toContain('font-weight: 700');
    expect(css).toContain('letter-spacing: -0.03em');
    expect(css).toContain('glass-line');
    expect(css).toContain('420ms');
    expect(css).toContain('-webkit-search-cancel-button');
    expect(css).toContain('prefers-reduced-motion');
  });
});

function stylesheet(component: unknown): string {
  const def = (component as { ɵcmp?: { styles?: string[] | string } }).ɵcmp;
  const fromDef = def?.styles == null ? '' : Array.isArray(def.styles) ? def.styles.join('\n') : String(def.styles);
  const fromDoc = [...document.querySelectorAll('style')].map((s) => s.textContent ?? '').join('\n');
  return `${fromDef}\n${fromDoc}`;
}
