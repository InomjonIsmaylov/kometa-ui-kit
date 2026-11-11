import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormField, form, max, min } from '@angular/forms/signals';
import { KometaStepper } from './kometa-stepper';

@Component({
  imports: [KometaStepper],
  template: `<k-stepper [(value)]="value" [min]="min()" [max]="max()" [step]="step()" [unit]="unit()"
    [disabled]="disabled()" ariaLabel="Davomiyligi" decrementLabel="Kamaytirish" incrementLabel="Oshirish" />`,
})
class Host {
  value = signal(30);
  min = signal(5);
  max = signal(180);
  step = signal(5);
  unit = signal('daq');
  disabled = signal(false);
}

@Component({
  imports: [KometaStepper, FormField],
  template: `<k-stepper [formField]="f.minutes" [step]="5" />`,
})
class FormsHost {
  model = signal({ minutes: 30 });
  f = form(this.model, (p) => {
    min(p.minutes, 10);
    max(p.minutes, 40);
  });
}

describe('KometaStepper', () => {
  function render() {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const el = f.nativeElement.querySelector('k-stepper') as HTMLElement;
    const [minus, plus] = Array.from(el.querySelectorAll('button')) as HTMLButtonElement[];
    const fig = el.querySelector('.fig') as HTMLElement;
    return { f, el, minus, plus, fig };
  }
  const key = (el: HTMLElement, k: string) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));

  it('renders two circles around one figure with its unit', () => {
    const { el, minus, plus, fig } = render();
    expect(minus.getAttribute('aria-label')).toBe('Kamaytirish');
    expect(plus.getAttribute('aria-label')).toBe('Oshirish');
    expect(fig.querySelector('b')!.textContent).toBe('30');
    expect(el.querySelector('.unit')!.textContent!.trim()).toBe('daq');
  });

  it('omits the unit when none is given', () => {
    const { f, el } = render();
    f.componentInstance.unit.set('');
    f.detectChanges();
    expect(el.querySelector('.unit')).toBeNull();
  });

  it('steps the model by step with the buttons', () => {
    const { f, minus, plus } = render();
    plus.click();
    plus.click();
    f.detectChanges();
    expect(f.componentInstance.value()).toBe(40);
    minus.click();
    f.detectChanges();
    expect(f.componentInstance.value()).toBe(35);
  });

  it('dims the circle at a limit and never passes it', () => {
    const { f, minus, plus } = render();
    f.componentInstance.value.set(5);
    f.detectChanges();
    expect(minus.disabled).toBe(true);
    expect(plus.disabled).toBe(false);
    minus.click();
    expect(f.componentInstance.value()).toBe(5);
    f.componentInstance.value.set(180);
    f.detectChanges();
    expect(plus.disabled).toBe(true);
  });

  it('exposes spinbutton semantics on the figure', () => {
    const { f, fig } = render();
    expect(fig.getAttribute('role')).toBe('spinbutton');
    expect(fig.getAttribute('aria-valuenow')).toBe('30');
    expect(fig.getAttribute('aria-valuemin')).toBe('5');
    expect(fig.getAttribute('aria-valuemax')).toBe('180');
    expect(fig.getAttribute('aria-valuetext')).toBe('30 daq');
    expect(fig.getAttribute('aria-label')).toBe('Davomiyligi');
    expect(fig.tabIndex).toBe(0);
    f.componentInstance.max.set(Infinity);
    f.detectChanges();
    expect(fig.hasAttribute('aria-valuemax')).toBe(false);
  });

  it('answers the arrow page home and end keys', () => {
    const { f, fig } = render();
    key(fig, 'ArrowUp');
    expect(f.componentInstance.value()).toBe(35);
    key(fig, 'ArrowDown');
    key(fig, 'ArrowDown');
    expect(f.componentInstance.value()).toBe(25);
    key(fig, 'PageUp');
    expect(f.componentInstance.value()).toBe(75);
    key(fig, 'PageDown');
    expect(f.componentInstance.value()).toBe(25);
    key(fig, 'End');
    expect(f.componentInstance.value()).toBe(180);
    key(fig, 'Home');
    expect(f.componentInstance.value()).toBe(5);
    const e = new KeyboardEvent('keydown', { key: 'a', cancelable: true });
    fig.dispatchEvent(e);
    expect(e.defaultPrevented).toBe(false);
  });

  it('ignores keys and dims both circles when disabled', () => {
    const { f, minus, plus, fig } = render();
    f.componentInstance.disabled.set(true);
    f.detectChanges();
    expect(minus.disabled && plus.disabled).toBe(true);
    expect(fig.getAttribute('aria-disabled')).toBe('true');
    expect(fig.tabIndex).toBe(-1);
    key(fig, 'ArrowUp');
    expect(f.componentInstance.value()).toBe(30);
  });

  it('rolls the figure on a change but not on mount', () => {
    const { f, minus, plus, fig } = render();
    expect(fig.querySelector('b')!.className).not.toMatch(/up|down/);
    plus.click();
    f.detectChanges();
    expect(fig.querySelector('b')!.classList.contains('up')).toBe(true);
    minus.click();
    f.detectChanges();
    expect(fig.querySelector('b')!.classList.contains('down')).toBe(true);
  });

  it('removes the roll and the fade under reduced motion', () => {
    const css = stylesheet(KometaStepper);
    expect(css).toMatch(/prefers-reduced-motion: reduce\)[\s\S]*animation: none/);
    expect(css).toMatch(/prefers-reduced-motion: reduce\)[\s\S]*transition: none/);
  });

  it('uses tokens and a 44px target on a coarse pointer', () => {
    const css = stylesheet(KometaStepper);
    expect(css).toContain('var(--glass-line)');
    expect(css).toContain('var(--muted)');
    expect(css).toContain('var(--amber)');
    expect(css).toContain('pointer: coarse');
    expect(css.replace(/var\([^)]*\)/g, '')).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});

describe('KometaStepper inside Signal Forms', () => {
  it('binds the number and the limits through [formField]', async () => {
    const f = TestBed.createComponent(FormsHost);
    f.detectChanges();
    await f.whenStable();
    f.detectChanges();
    const [minus, plus] = Array.from((f.nativeElement as HTMLElement).querySelectorAll('button')) as HTMLButtonElement[];
    plus.click();
    plus.click();
    plus.click();
    await f.whenStable();
    f.detectChanges();
    expect(f.componentInstance.model().minutes).toBe(40);
    expect(plus.disabled).toBe(true);
    f.componentInstance.model.set({ minutes: 10 });
    f.detectChanges();
    await f.whenStable();
    f.detectChanges();
    expect(minus.disabled).toBe(true);
  });
});

function stylesheet(component: unknown): string {
  const def = (component as { ɵcmp?: { styles?: string[] | string } }).ɵcmp;
  const fromDef = def?.styles == null ? '' : Array.isArray(def.styles) ? def.styles.join('\n') : String(def.styles);
  const fromDoc = [...document.querySelectorAll('style')].map((s) => s.textContent ?? '').join('\n');
  return `${fromDef}\n${fromDoc}`.replace(/%NS%/g, '').replace(/\[_ng(?:content|host)-[^\]]*\]/g, '');
}
