import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaDigits } from './kometa-digits';

@Component({
  imports: [KometaDigits],
  template: `<k-digits [(value)]="value" />`,
})
class Host {
  value = signal('');
}

describe('KometaDigits', () => {
  function render() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('k-digits') as HTMLElement;
    const input = el.querySelector('input') as HTMLInputElement;
    return { fixture, el, input };
  }

  function type(input: HTMLInputElement, text: string) {
    for (const char of text) {
      input.value += char;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  it('groups 901234567 as the person types and stores digits only', () => {
    const { fixture, el, input } = render();
    expect(el.querySelector('.prefix')!.textContent!.trim()).toBe('+998');
    expect(input.value).not.toContain('+998');

    type(input, '901234567');
    fixture.detectChanges();

    expect(input.value).toBe('90 123 45 67');
    expect(fixture.componentInstance.value()).toBe('901234567');
    expect(el.textContent).toContain('+998');
  });

  it('keeps at most nine national digits', () => {
    const { fixture, input } = render();
    type(input, '9012345678');
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('901234567');
    expect(input.value).toBe('90 123 45 67');
  });
});
