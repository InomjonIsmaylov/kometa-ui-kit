import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaTick } from './kometa-tick';

@Component({
  imports: [KometaTick],
  template: `<kometa-tick ariaLabel="Accept the terms" inputId="terms" [disabled]="disabled()" [invalid]="invalid()" [(checked)]="checked" />`,
})
class Host {
  checked = signal(false);
  disabled = signal(false);
  invalid = signal(false);
}

describe('KometaTick', () => {
  function render() {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const btn = f.nativeElement.querySelector('button') as HTMLButtonElement;
    return { f, btn };
  }

  it('is a checkbox button named by the caller', () => {
    const { btn } = render();
    expect(btn.getAttribute('role')).toBe('checkbox');
    expect(btn.getAttribute('aria-label')).toBe('Accept the terms');
    expect(btn.id).toBe('terms');
    expect(btn.getAttribute('aria-checked')).toBe('false');
  });

  it('toggles the model on a click, and follows it from outside', () => {
    const { f, btn } = render();
    btn.click();
    f.detectChanges();
    expect(f.componentInstance.checked()).toBe(true);
    expect(btn.getAttribute('aria-checked')).toBe('true');
    f.componentInstance.checked.set(false);
    f.detectChanges();
    expect(btn.getAttribute('aria-checked')).toBe('false');
  });

  it('does nothing when disabled', () => {
    const { f, btn } = render();
    f.componentInstance.disabled.set(true);
    f.detectChanges();
    expect(btn.disabled).toBe(true);
    btn.click();
    expect(f.componentInstance.checked()).toBe(false);
  });

  it('marks itself invalid when asked', () => {
    const { f, btn } = render();
    f.componentInstance.invalid.set(true);
    f.detectChanges();
    expect(btn.getAttribute('aria-invalid')).toBe('true');
  });
});
