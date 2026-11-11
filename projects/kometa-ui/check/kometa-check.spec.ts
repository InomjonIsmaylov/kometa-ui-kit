import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaCheck } from './kometa-check';

@Component({
  imports: [KometaCheck],
  template: `
    <k-check [(checked)]="a" [disabled]="off()">Xizmatlarni qo'shing</k-check>
    <k-check [(checked)]="b">Rasm yuklang</k-check>
  `,
})
class Host {
  a = signal(true);
  b = signal(false);
  off = signal(false);
}

describe('KometaCheck', () => {
  function render() {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const buttons = () => [...f.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    return { f, buttons };
  }

  it('is a real button with the checkbox role and no box drawn', () => {
    const { f, buttons } = render();
    const [first] = buttons();
    expect(first.tagName).toBe('BUTTON');
    expect(first.getAttribute('type')).toBe('button');
    expect(first.getAttribute('role')).toBe('checkbox');
    expect(f.nativeElement.querySelector('svg, input, rect')).toBeNull();
  });

  it('projects the label and reflects checked in aria-checked', () => {
    const { buttons } = render();
    expect(buttons()[0].textContent).toContain("Xizmatlarni qo'shing");
    expect(buttons().map((b) => b.getAttribute('aria-checked'))).toEqual(['true', 'false']);
  });

  it('toggles the model on click both ways', () => {
    const { f, buttons } = render();
    buttons()[1].click();
    f.detectChanges();
    expect(f.componentInstance.b()).toBe(true);
    expect(buttons()[1].getAttribute('aria-checked')).toBe('true');
    buttons()[1].click();
    f.detectChanges();
    expect(f.componentInstance.b()).toBe(false);
  });

  it('is natively keyboard operable as a focusable button with no tabindex', () => {
    const { buttons } = render();
    const [first] = buttons();
    first.focus();
    expect(document.activeElement).toBe(first);
    expect(first.hasAttribute('tabindex')).toBe(false);
  });

  it('does not toggle while disabled', () => {
    const { f, buttons } = render();
    f.componentInstance.off.set(true);
    f.detectChanges();
    expect(buttons()[0].disabled).toBe(true);
    buttons()[0].click();
    f.detectChanges();
    expect(f.componentInstance.a()).toBe(true);
  });

  it('draws the strike as a 1px line that scales in over 420ms and mutes the label', () => {
    render();
    const css = stylesheet(KometaCheck);
    expect(css).toContain('background-size: 0 1px');
    expect(css).toMatch(/aria-checked=true\] \.label \{[^}]*background-size: 100% 1px/);
    expect(css).toContain('420ms var(--ease-spring');
    expect(css).toMatch(/aria-checked=true\] \.label \{[^}]*color: var\(--muted\)/);
    expect(css).toContain('box-decoration-break: slice');
  });

  it('lets a long label wrap and never truncates it', () => {
    render();
    const css = stylesheet(KometaCheck);
    expect(css).toContain('overflow-wrap: break-word');
    expect(css).not.toContain('ellipsis');
    expect(css).not.toMatch(/white-space:\s*nowrap/);
  });

  it('has a focus ring and a 44px target on a coarse pointer', () => {
    render();
    const css = stylesheet(KometaCheck);
    expect(css).toContain('button:focus-visible { outline: 2px solid var(--amber); outline-offset: 2px; }');
    expect(css).toMatch(/pointer: coarse\) \{ button \{ min-height: 44px/);
  });

  it('uses tokens rather than colour literals and drops motion under prefers-reduced-motion', () => {
    render();
    const css = stylesheet(KometaCheck);
    expect(css).toContain('var(--display-ink');
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
