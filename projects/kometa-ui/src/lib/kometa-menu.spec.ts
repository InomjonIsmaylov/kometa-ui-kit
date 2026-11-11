import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { form, FormField } from '@angular/forms/signals';
import { KometaMenu } from './kometa-menu';

const OPTIONS = [
  { value: 'near', label: 'Yaqinroq' },
  { value: 'rating', label: 'Reyting' },
  { value: 'price', label: 'Narx' },
];

@Component({
  imports: [KometaMenu],
  template: `<kometa-menu [(value)]="value" [options]="options" label="Saralash" ariaLabel="Tartib" [disabled]="off()" />`,
})
class Host {
  value = signal('near');
  options = OPTIONS;
  off = signal(false);
}

@Component({
  imports: [FormField, KometaMenu],
  template: `<kometa-menu [formField]="f.sort" [options]="options" label="Saralash" />`,
})
class FormHost {
  model = signal({ sort: 'rating' });
  f = form(this.model);
  options = OPTIONS;
}

describe('KometaMenu', () => {
  function render() {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const el = f.nativeElement as HTMLElement;
    const trigger = el.querySelector('button.trigger') as HTMLButtonElement;
    const options = () => [...el.querySelectorAll('[role="option"]')] as HTMLButtonElement[];
    const list = el.querySelector('[role="listbox"]') as HTMLElement;
    return { f, el, trigger, options, list };
  }

  function key(target: HTMLElement, name: string) {
    target.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true }));
  }

  it('renders the prefix word then the chosen value and a caret on the trigger', () => {
    const { trigger } = render();
    expect(trigger.querySelector('.prefix')!.textContent).toBe('Saralash');
    expect(trigger.querySelector('.chosen')!.textContent).toBe('Yaqinroq');
    expect(trigger.querySelector('svg.caret')).not.toBeNull();
  });

  it('declares a listbox popup closed at first', () => {
    const { trigger, list } = render();
    expect(trigger.getAttribute('aria-haspopup')).toBe('listbox');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.getAttribute('aria-controls')).toBe(list.id);
    expect(trigger.getAttribute('aria-label')).toBe('Tartib');
    expect(list.getAttribute('aria-label')).toBe('Tartib');
  });

  it('lists every option with aria-selected on the chosen one only', () => {
    const { options } = render();
    expect(options().map((o) => o.textContent!.trim())).toEqual(['Yaqinroq', 'Reyting', 'Narx']);
    expect(options().map((o) => o.getAttribute('aria-selected'))).toEqual(['true', 'false', 'false']);
  });

  it('keeps one option in the tab order', () => {
    const { options } = render();
    expect(options().map((o) => o.tabIndex)).toEqual([0, -1, -1]);
  });

  it('opens inline on a click of the trigger', () => {
    const { f, el, trigger } = render();
    trigger.click();
    f.detectChanges();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(el.querySelector('kometa-menu')!.classList.contains('open')).toBe(true);
  });

  it('closes again on a second click of the trigger', () => {
    const { f, trigger } = render();
    trigger.click();
    f.detectChanges();
    trigger.click();
    f.detectChanges();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('chooses an option then closes and returns focus to the trigger', () => {
    const { f, trigger, options } = render();
    trigger.click();
    f.detectChanges();
    options()[2].click();
    f.detectChanges();
    expect(f.componentInstance.value()).toBe('price');
    expect(trigger.querySelector('.chosen')!.textContent).toBe('Narx');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(trigger);
    expect(options().map((o) => o.getAttribute('aria-selected'))).toEqual(['false', 'false', 'true']);
  });

  it('closes on Escape and returns focus to the trigger', () => {
    const { f, trigger, options } = render();
    trigger.click();
    f.detectChanges();
    key(options()[1], 'Escape');
    f.detectChanges();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(trigger);
  });

  it('ignores Escape while closed', () => {
    const { f, trigger } = render();
    key(trigger, 'Escape');
    f.detectChanges();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('opens with ArrowDown on the trigger', () => {
    const { f, trigger } = render();
    key(trigger, 'ArrowDown');
    f.detectChanges();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
  });

  it('moves focus between options with the arrow keys and Home and End', () => {
    const { f, trigger, options } = render();
    trigger.click();
    f.detectChanges();
    const [a, b, c] = options();
    a.focus();
    key(a, 'ArrowDown');
    expect(document.activeElement).toBe(b);
    key(b, 'ArrowDown');
    expect(document.activeElement).toBe(c);
    key(c, 'ArrowDown');
    expect(document.activeElement).toBe(c);
    key(c, 'ArrowUp');
    expect(document.activeElement).toBe(b);
    key(b, 'Home');
    expect(document.activeElement).toBe(a);
    key(a, 'End');
    expect(document.activeElement).toBe(c);
  });

  it('does not open while disabled', () => {
    const { f, trigger } = render();
    f.componentInstance.off.set(true);
    f.detectChanges();
    expect(trigger.disabled).toBe(true);
    key(trigger, 'ArrowDown');
    f.detectChanges();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('shows an empty value for a value that is not an option', () => {
    const { f, trigger } = render();
    f.componentInstance.value.set('nope');
    f.detectChanges();
    expect(trigger.querySelector('.chosen')!.textContent).toBe('');
  });

  it('works as a Signal Forms value control', async () => {
    const f = TestBed.createComponent(FormHost);
    await f.whenStable();
    const el = f.nativeElement as HTMLElement;
    expect(el.querySelector('.chosen')!.textContent).toBe('Reyting');
    (el.querySelectorAll('[role="option"]')[2] as HTMLElement).click();
    await f.whenStable();
    expect(f.componentInstance.model().sort).toBe('price');
  });

  it('pushes the page by animating grid rows from 0fr to 1fr over 420ms', () => {
    const css = ownStyles(KometaMenu);
    expect(css).toContain('grid-template-rows: 0fr');
    expect(css).toMatch(/\.open \.stack \{ grid-template-rows: 1fr;/);
    expect(css).toContain('grid-template-rows 420ms');
    expect(css).not.toContain('position: absolute');
  });

  it('sets the options as Syne 22px words with a trailing bead on the chosen one', () => {
    const css = ownStyles(KometaMenu);
    expect(css).toContain('font-size: 22px');
    expect(css).toContain("font-family: var(--font-display, Syne, sans-serif)");
    expect(css).toMatch(/aria-selected=true\]::after/);
    expect(css).toMatch(/aria-selected=true\] \{ color: var\(--display-ink/);
  });

  it('uses tokens and no colour literal outside a var fallback', () => {
    const css = ownStyles(KometaMenu);
    for (const token of ['var(--muted)', 'var(--amber)', 'var(--ease-spring']) expect(css).toContain(token);
    expect(literalColours(css)).toEqual([]);
  });

  it('removes the transitions for reduced motion', () => {
    expect(ownStyles(KometaMenu)).toMatch(/prefers-reduced-motion: reduce\)\s*\{[^}]*transition: none/);
  });

  it('is 44px on a coarse pointer', () => {
    expect(ownStyles(KometaMenu)).toMatch(/pointer: coarse\)\s*\{[^}]*min-height: 44px/);
  });
});

/** Colour literals that are not the fallback inside a `var(--x, ...)`. */
function literalColours(css: string): string[] {
  const noFallbacks = css.replace(/var\(--[\w-]+,\s*[^()]*(\([^()]*\)[^()]*)*\)/g, '');
  return noFallbacks.match(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)/g) ?? [];
}

function ownStyles(component: unknown): string {
  const styles = (component as { ɵcmp?: { styles?: string[] | string } }).ɵcmp?.styles;
  const css = styles == null ? '' : Array.isArray(styles) ? styles.join('\n') : String(styles);
  // The compiler scopes selectors and namespaces tokens; undo that so the assertions read like the source.
  return css.replace(/%NS%/g, '').replace(/\[_ng(?:content|host)-%COMP%\]/g, '').replace(/["']/g, '').replace(/\s+/g, ' ');
}
