import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaWait } from './kometa-wait';

@Component({
  imports: [KometaWait],
  template: `<k-wait [label]="label()" />`,
})
class Host {
  label = signal('Yuklanmoqda');
}

describe('KometaWait', () => {
  it('keeps the label as a status while the line can hold still', () => {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const el = f.nativeElement.querySelector('k-wait') as HTMLElement;
    expect(el.getAttribute('role')).toBe('status');
    expect(el.textContent).toContain('Yuklanmoqda');
    const css = stylesheet(KometaWait);
    expect(css).toContain('prefers-reduced-motion');
    expect(css).toContain('animation: none');
  });
});

function stylesheet(component: unknown): string {
  const def = (component as { ɵcmp?: { styles?: string[] | string } }).ɵcmp;
  const fromDef = def?.styles == null ? '' : Array.isArray(def.styles) ? def.styles.join('\n') : String(def.styles);
  const fromDoc = [...document.querySelectorAll('style')].map((s) => s.textContent ?? '').join('\n');
  return `${fromDef}\n${fromDoc}`;
}
