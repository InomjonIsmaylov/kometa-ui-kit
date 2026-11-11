import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { form, FormField } from '@angular/forms/signals';
import { KometaToggle } from './kometa-toggle';

@Component({
  imports: [KometaToggle],
  template: `<k-toggle [(checked)]="on" onLabel="Yoqilgan" offLabel="Oʻchiq" ariaLabel="SMS eslatma" ariaDescribedBy="why" [disabled]="off()" />`,
})
class Host {
  on = signal(true);
  off = signal(false);
}

@Component({
  imports: [FormField, KometaToggle],
  template: `<k-toggle [formField]="f.sms" onLabel="Yoqilgan" offLabel="Oʻchiq" />`,
})
class FormHost {
  model = signal({ sms: false });
  f = form(this.model);
}

describe('KometaToggle', () => {
  function render() {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const button = (f.nativeElement as HTMLElement).querySelector('button') as HTMLButtonElement;
    return { f, button };
  }

  it('is a switch button named by the caller', () => {
    const { button } = render();
    expect(button.type).toBe('button');
    expect(button.getAttribute('role')).toBe('switch');
    expect(button.getAttribute('aria-label')).toBe('SMS eslatma');
  });

  it('points at the element that explains it',()=> {
    const { button } = render();
    expect(button.getAttribute('aria-describedby')).toBe('why');
  });

  it('shows the on word and aria-checked true while checked', () => {
    const { button } = render();
    expect(button.getAttribute('aria-checked')).toBe('true');
    expect(button.textContent!.trim()).toBe('Yoqilgan');
  });

  it('swaps to the off word when unchecked', () => {
    const { f, button } = render();
    f.componentInstance.on.set(false);
    f.detectChanges();
    expect(button.getAttribute('aria-checked')).toBe('false');
    expect(button.textContent!.trim()).toBe('Oʻchiq');
  });

  it('toggles on click and writes the model back', () => {
    const { f, button } = render();
    button.click();
    f.detectChanges();
    expect(f.componentInstance.on()).toBe(false);
    button.click();
    f.detectChanges();
    expect(f.componentInstance.on()).toBe(true);
  });

  it('toggles from the keyboard through the native button click', () => {
    // A <button> turns Space and Enter into a click; the spec fixes that the element is one and is focusable.
    const { button } = render();
    expect(button.tagName).toBe('BUTTON');
    expect(button.tabIndex).toBe(0);
  });

  it('does not toggle while disabled', () => {
    const { f, button } = render();
    f.componentInstance.off.set(true);
    f.detectChanges();
    expect(button.disabled).toBe(true);
    button.click();
    expect(f.componentInstance.on()).toBe(true);
  });

  it('has no aria-label when the caller gives none', () => {
    const f = TestBed.createComponent(FormHost);
    f.detectChanges();
    expect((f.nativeElement as HTMLElement).querySelector('button')!.hasAttribute('aria-label')).toBe(false);
  });

  it('works as a Signal Forms boolean control', async () => {
    const f = TestBed.createComponent(FormHost);
    await f.whenStable();
    const button = (f.nativeElement as HTMLElement).querySelector('button') as HTMLButtonElement;
    expect(button.getAttribute('aria-checked')).toBe('false');
    button.click();
    await f.whenStable();
    expect(f.componentInstance.model().sms).toBe(true);
    expect(button.getAttribute('aria-checked')).toBe('true');
    expect(button.textContent!.trim()).toBe('Yoqilgan');
  });

  it('draws the cream line as a scaleX spring and keeps it off in the off state', () => {
    const css = ownStyles(KometaToggle);
    expect(css).toContain('transform: scaleX(0)');
    expect(css).toContain("button[aria-checked=true]::after { transform: scaleX(1); }");
    expect(css).toContain('420ms var(--ease-spring');
    expect(css).toContain("font-family: var(--font-display, Syne, sans-serif)");
  });

  it('is cream not amber when on', () => {
    const css = ownStyles(KometaToggle);
    expect(css).toMatch(/aria-checked=true\] \{ color: var\(--toggle-ink-on, var\(--display-ink/);
    expect(css).not.toMatch(/background:\s*var\(--amber\)/);
  });

  it('uses tokens and no colour literal outside a var fallback', () => {
    const css = ownStyles(KometaToggle);
    expect(css).toContain('var(--muted)');
    expect(literalColours(css)).toEqual([]);
  });

  it('removes the transitions for reduced motion', () => {
    expect(ownStyles(KometaToggle)).toMatch(/prefers-reduced-motion: reduce\)\s*\{[^}]*transition: none/);
  });

  it('is 44px on a coarse pointer', () => {
    expect(ownStyles(KometaToggle)).toMatch(/pointer: coarse\)\s*\{[^}]*min-height: 44px/);
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
