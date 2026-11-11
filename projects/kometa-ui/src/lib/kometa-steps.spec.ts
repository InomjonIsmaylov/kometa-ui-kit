import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaSteps } from './kometa-steps';

@Component({
  imports: [KometaSteps],
  template: `<k-steps [steps]="steps()" [current]="current()" [ariaLabel]="label()" />`,
})
class Host {
  steps = signal(['Raqam', 'Kod', 'Salon', 'Manzil', 'Xizmat', 'Tayyor']);
  current = signal(2);
  label = signal('');
}

describe('KometaSteps', () => {
  function render() {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const el = f.nativeElement.querySelector('k-steps') as HTMLElement;
    const rows = () => [...el.querySelectorAll('li')] as HTMLElement[];
    return { f, el, rows };
  }

  it('renders one ordered-list row per step with the caller words', () => {
    const { el, rows } = render();
    expect(el.querySelector('ol')).not.toBeNull();
    expect(rows().map((r) => r.textContent?.trim())).toEqual(['Raqam', 'Kod', 'Salon', 'Manzil', 'Xizmat', 'Tayyor']);
  });

  it('marks the earlier steps done and the current one with aria-current step', () => {
    const { rows } = render();
    expect(rows().map((r) => r.classList.contains('done'))).toEqual([true, false, false, false, false, false]);
    expect(rows().map((r) => r.classList.contains('cur'))).toEqual([false, true, false, false, false, false]);
    expect(rows().map((r) => r.getAttribute('aria-current'))).toEqual([null, 'step', null, null, null, null]);
  });

  it('moves the current mark and the bead offset when current changes', () => {
    const { f, el, rows } = render();
    const bead = el.querySelector('.bead') as HTMLElement;
    expect(bead.style.getPropertyValue('--steps-cur')).toBe('1');
    f.componentInstance.current.set(5);
    f.detectChanges();
    expect(rows()[4].getAttribute('aria-current')).toBe('step');
    expect(rows().filter((r) => r.classList.contains('done')).length).toBe(4);
    expect(bead.style.getPropertyValue('--steps-cur')).toBe('4');
  });

  it('clamps current into the list', () => {
    const { f, el, rows } = render();
    f.componentInstance.current.set(99);
    f.detectChanges();
    expect(rows()[5].getAttribute('aria-current')).toBe('step');
    expect((el.querySelector('.bead') as HTMLElement).style.getPropertyValue('--steps-cur')).toBe('5');
    f.componentInstance.current.set(0);
    f.detectChanges();
    expect(rows()[0].getAttribute('aria-current')).toBe('step');
  });

  it('hides the bead from assistive tech and is not interactive', () => {
    const { el } = render();
    expect((el.querySelector('.bead') as HTMLElement).getAttribute('aria-hidden')).toBe('true');
    expect(el.querySelector('button, a, [tabindex]')).toBeNull();
  });

  it('labels the list only when the caller gives a name', () => {
    const { f, el } = render();
    expect(el.querySelector('ol')!.hasAttribute('aria-label')).toBe(false);
    f.componentInstance.label.set('Roʻyxatdan oʻtish');
    f.detectChanges();
    expect(el.querySelector('ol')!.getAttribute('aria-label')).toBe('Roʻyxatdan oʻtish');
  });

  it('draws no bead for an empty list', () => {
    const { f, el } = render();
    f.componentInstance.steps.set([]);
    f.detectChanges();
    expect(el.querySelector('.bead')).toBeNull();
  });

  it('derives the bead travel from the row height variable and springs over 680ms', () => {
    render();
    const css = stylesheet(KometaSteps);
    expect(css).toContain('--steps-row: 30px');
    expect(css).toContain('translateY(calc(var(--steps-cur, 0) * var(--steps-row)))');
    expect(css).toContain('680ms cubic-bezier(0.22, 1.35, 0.32, 1)');
  });

  it('sets the current step in Syne 700 and uses tokens rather than colour literals', () => {
    render();
    const css = stylesheet(KometaSteps);
    expect(css).toContain('var(--font-display');
    expect(css).toContain('font-weight: 700');
    expect(css).toContain('var(--muted)');
    expect(css).toContain('var(--display-ink');
    const literals = [...css.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map((m) => m[0].toLowerCase());
    expect(literals.every((l) => l === '#f4efe6')).toBe(true);
    expect(css).not.toMatch(/(?<!var\(--display-ink, )#f4efe6/);
  });

  it('drops its transitions under prefers-reduced-motion', () => {
    render();
    expect(stylesheet(KometaSteps)).toMatch(/prefers-reduced-motion: reduce\)\s*\{[^}]*transition: none/);
  });
});

function stylesheet(component: unknown): string {
  const def = (component as { ɵcmp?: { styles?: string[] | string } }).ɵcmp;
  const css = def?.styles == null ? '' : Array.isArray(def.styles) ? def.styles.join(' ') : String(def.styles);
  // Only this component's own rules, whitespace collapsed and the emulated-encapsulation attributes removed.
  return css.replaceAll('%NS%', '').replace(/\[_ng(?:content|host)-[^\]]*\]/g, '').replace(/\s+/g, ' ');
}
