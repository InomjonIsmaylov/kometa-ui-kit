import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormField, form, maxLength, required } from '@angular/forms/signals';
import { KometaField } from './kometa-field';

@Component({
  imports: [KometaField],
  template: `
    <kometa-field
      [(value)]="value"
      [label]="label()"
      [type]="type()"
      [size]="size()"
      [maxLength]="max()"
      [showCount]="showCount()"
      [error]="error()"
      [disabled]="disabled()"
      [readonly]="readonly()"
      [required]="required()"
      name="salon"
      inputmode="text"
      autocomplete="organization"
    />
  `,
})
class Host {
  field = viewChild.required(KometaField);
  value = signal('');
  label = signal('Salon nomi');
  type = signal<'text' | 'email' | 'tel' | 'url' | 'password'>('text');
  size = signal<'md' | 'sm'>('md');
  max = signal<number | undefined>(40);
  showCount = signal(false);
  error = signal('');
  disabled = signal(false);
  readonly = signal(false);
  required = signal(false);
}

@Component({
  imports: [KometaField, FormField],
  template: `<kometa-field [formField]="f.name" label="Salon nomi" showCount />`,
})
class FormsHost {
  model = signal({ name: '' });
  f = form(this.model, (p) => {
    required(p.name, { message: 'Nom kerak.' });
    maxLength(p.name, 10);
  });
  field = viewChild.required(KometaField);
}

describe('KometaField', () => {
  function render() {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const root = f.nativeElement.querySelector('kometa-field') as HTMLElement;
    const input = root.querySelector('input') as HTMLInputElement;
    return { f, root, input };
  }

  function type(input: HTMLInputElement, text: string) {
    input.value = text;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  it('renders a boxless input whose placeholder and accessible name are the label', () => {
    const { root, input } = render();
    expect(input.placeholder).toBe('Salon nomi');
    expect(input.getAttribute('aria-label')).toBe('Salon nomi');
    expect(root.querySelector('label')).toBeNull();
    expect(root.querySelector('.rule')).not.toBeNull();
  });

  it('forwards name, inputmode, autocomplete and type to the input', () => {
    const { f, input } = render();
    expect(input.getAttribute('name')).toBe('salon');
    expect(input.getAttribute('inputmode')).toBe('text');
    expect(input.getAttribute('autocomplete')).toBe('organization');
    expect(input.type).toBe('text');
    for (const t of ['email', 'tel', 'url', 'password'] as const) {
      f.componentInstance.type.set(t);
      f.detectChanges();
      expect(input.type).toBe(t);
    }
  });

  it('writes typing to the two-way value and reads a pushed value back', () => {
    const { f, input } = render();
    type(input, 'Aziz Barber');
    expect(f.componentInstance.value()).toBe('Aziz Barber');
    f.componentInstance.value.set('Nur');
    f.detectChanges();
    expect(input.value).toBe('Nur');
  });

  it('sets maxlength on the input', () => {
    const { f, input } = render();
    expect(input.getAttribute('maxlength')).toBe('40');
    f.componentInstance.max.set(undefined);
    f.detectChanges();
    expect(input.hasAttribute('maxlength')).toBe(false);
  });

  it('shows no counter unless showCount is set', () => {
    const { f, root } = render();
    expect(root.querySelector('.count')).toBeNull();
    f.componentInstance.showCount.set(true);
    f.detectChanges();
    expect((root.querySelector('.count') as HTMLElement).textContent?.trim()).toBe('0 / 40');
  });

  it('counts as 4 / 40 as you type and drops the ceiling without maxLength', () => {
    const { f, root, input } = render();
    f.componentInstance.showCount.set(true);
    f.detectChanges();
    type(input, 'Aziz');
    f.detectChanges();
    expect((root.querySelector('.count') as HTMLElement).textContent?.trim()).toBe('4 / 40');
    f.componentInstance.max.set(undefined);
    f.detectChanges();
    expect((root.querySelector('.count') as HTMLElement).textContent?.trim()).toBe('4');
  });

  it('keeps an empty role=alert line in the page and fills it from error', () => {
    const { f, root, input } = render();
    const alert = root.querySelector('[role="alert"]') as HTMLElement;
    expect(alert.textContent?.trim()).toBe('');
    expect(input.getAttribute('aria-invalid')).toBeNull();
    expect(root.querySelector('.field')?.classList.contains('is-bad')).toBe(false);
    f.componentInstance.error.set('Nom kerak.');
    f.detectChanges();
    expect(alert.textContent?.trim()).toBe('Nom kerak.');
    expect(root.querySelector('.field')?.classList.contains('is-bad')).toBe(true);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe(alert.id);
  });

  it('marks required for assistive tech without the native attribute', () => {
    const { f, input } = render();
    expect(input.getAttribute('aria-required')).toBeNull();
    f.componentInstance.required.set(true);
    f.detectChanges();
    expect(input.getAttribute('aria-required')).toBe('true');
    expect(input.required).toBe(false);
  });

  it('honours disabled and readonly', () => {
    const { f, input } = render();
    f.componentInstance.disabled.set(true);
    f.componentInstance.readonly.set(true);
    f.detectChanges();
    expect(input.disabled).toBe(true);
    expect(input.readOnly).toBe(true);
  });

  it('sets data-size and a smaller Syne for sm', () => {
    const { f, root } = render();
    expect(root.getAttribute('data-size')).toBe('md');
    f.componentInstance.size.set('sm');
    f.detectChanges();
    expect(root.getAttribute('data-size')).toBe('sm');
    const css = stylesheet(KometaField);
    expect(css).toContain('font-size: var(--field-size, 24px)');
    expect(css).toContain("[data-size=sm] input { font-size: var(--field-size-sm, 18px)");
  });

  it('forwards focus() to the input', () => {
    const { f, input } = render();
    f.componentInstance.field().focus();
    expect(document.activeElement).toBe(input);
  });

  it('emits touch on blur', () => {
    const { f, input } = render();
    let n = 0;
    f.componentInstance.field().touch.subscribe(() => n++);
    input.dispatchEvent(new Event('blur'));
    expect(n).toBe(1);
  });

  it('draws the line in with the overshoot spring and a Syne 700 placeholder', () => {
    const css = stylesheet(KometaField);
    expect(css).toContain('scaleX(0)');
    expect(css).toContain('transform-origin: left');
    expect(css).toContain('680ms');
    expect(css).toContain('--drawer-ease');
    expect(css).toContain('font-weight: 700');
    expect(css).toContain('font-family: var(--font-display, Syne, sans-serif)');
    expect(css).toContain('border: 0');
    expect(css).toContain('tabular-nums');
  });

  it('removes its transitions under reduced motion and gives a coarse pointer 44px', () => {
    const css = stylesheet(KometaField);
    expect(css).toMatch(/prefers-reduced-motion: reduce\) \{[^}]*transition: none/);
    expect(css).toMatch(/pointer: coarse\) \{[^}]*min-height: 44px/);
  });

  it('uses tokens rather than colour literals', () => {
    const css = stylesheet(KometaField);
    expect(css).toContain('var(--error)');
    expect(css).toContain('var(--muted)');
    expect(css).toContain('var(--glass-line');
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).not.toMatch(/rgba?\(/);
  });
});

describe('KometaField inside Signal Forms', () => {
  function render() {
    const f = TestBed.createComponent(FormsHost);
    f.detectChanges();
    const root = f.nativeElement.querySelector('kometa-field') as HTMLElement;
    const input = root.querySelector('input') as HTMLInputElement;
    return { f, root, input };
  }

  it('binds the model both ways through [formField]', async () => {
    const { f, input } = render();
    input.value = 'Aziz';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await f.whenStable();
    expect(f.componentInstance.model().name).toBe('Aziz');
    f.componentInstance.model.set({ name: 'Nur' });
    f.detectChanges();
    await f.whenStable();
    expect(input.value).toBe('Nur');
  });

  it('shows the validator message once touched and takes maxLength from the field', async () => {
    const { f, root, input } = render();
    const alert = root.querySelector('[role="alert"]') as HTMLElement;
    expect(alert.textContent?.trim()).toBe('');
    expect(input.getAttribute('maxlength')).toBe('10');
    input.dispatchEvent(new Event('blur'));
    f.detectChanges();
    await f.whenStable();
    f.detectChanges();
    expect(alert.textContent?.trim()).toBe('Nom kerak.');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-required')).toBe('true');
  });
});

function stylesheet(component: unknown): string {
  const styles = (component as { ɵcmp?: { styles?: string[] | string } }).ɵcmp?.styles;
  const css = styles == null ? '' : Array.isArray(styles) ? styles.join('\n') : String(styles);
  // The compiler scopes selectors and namespaces tokens; undo that so the assertions read like the source.
  return css.replace(/%NS%/g, '').replace(/\[_ng(?:content|host)-%COMP%\]/g, '').replace(/["']/g, '').replace(/\s+/g, ' ');
}

/** Colour literals that are not the fallback inside a `var(--x, ...)`. */
function literalColours(css: string): string[] {
  const noFallbacks = css.replace(/var\(--[\w-]+,\s*[^()]*(\([^()]*\)[^()]*)*\)/g, '');
  return noFallbacks.match(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)/g) ?? [];
}
