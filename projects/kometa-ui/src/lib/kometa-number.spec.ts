import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { KometaNumber } from './kometa-number';

@Component({
  imports: [KometaNumber],
  template: `<k-number ariaLabel="Years" [min]="0" [max]="60" [disabled]="disabled()" [(value)]="value" />`,
})
class Host {
  value = signal<number | null>(12);
  disabled = signal(false);
}

describe('KometaNumber', () => {
  function render() {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const root = f.nativeElement.querySelector('k-number') as HTMLElement;
    const input = root.querySelector('input') as HTMLInputElement;
    const type = (text: string) => { input.value = text; input.dispatchEvent(new Event('input')); f.detectChanges(); };
    const key = (k: string, shiftKey = false) => {
      const e = new KeyboardEvent('keydown', { key: k, shiftKey, bubbles: true, cancelable: true });
      input.dispatchEvent(e);
      f.detectChanges();
      return e;
    };
    const blur = () => { input.dispatchEvent(new Event('blur')); f.detectChanges(); };
    return { f, root, input, type, key, blur };
  }

  it('is a spinbutton named by the caller, showing the model and its range', () => {
    const { input } = render();
    expect(input.getAttribute('role')).toBe('spinbutton');
    expect(input.getAttribute('aria-label')).toBe('Years');
    expect(input.value).toBe('12');
    expect(input.getAttribute('aria-valuemin')).toBe('0');
    expect(input.getAttribute('aria-valuemax')).toBe('60');
    expect(input.getAttribute('aria-valuenow')).toBe('12');
    expect(input.inputMode).toBe('numeric');
  });

  it('keeps only digits and writes the number to the model as it is typed', () => {
    const { f, input, type } = render();
    type('4a5');
    expect(input.value).toBe('45');
    expect(f.componentInstance.value()).toBe(45);
  });

  it('holds an out-of-range number at the nearest end, flags it, and tidies the box on blur', () => {
    const { f, root, input, type, blur } = render();
    type('99');
    expect(f.componentInstance.value()).toBe(60);
    expect(input.value).toBe('99');
    expect(root.classList.contains('bad')).toBe(true);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    blur();
    expect(input.value).toBe('60');
    expect(root.classList.contains('bad')).toBe(false);
  });

  it('turns an empty box into null, and shows it empty', () => {
    const { f, input, type, blur } = render();
    type('');
    expect(f.componentInstance.value()).toBeNull();
    blur();
    expect(input.value).toBe('');
    expect(input.hasAttribute('aria-valuenow')).toBe(false);
  });

  it('steps with the arrow keys by one, by ten with Shift, and stops at both ends', () => {
    const { f, key } = render();
    key('ArrowUp');
    expect(f.componentInstance.value()).toBe(13);
    key('ArrowDown', true);
    expect(f.componentInstance.value()).toBe(3);
    key('ArrowDown', true);
    expect(f.componentInstance.value()).toBe(0);
    f.componentInstance.value.set(55);
    f.detectChanges();
    key('ArrowUp', true);
    expect(f.componentInstance.value()).toBe(60);
  });

  it('starts an empty box at the minimum whichever arrow is pressed, and leaves other keys alone', () => {
    const { f, key } = render();
    f.componentInstance.value.set(null);
    f.detectChanges();
    key('ArrowUp');
    expect(f.componentInstance.value()).toBe(0);
    f.componentInstance.value.set(null);
    f.detectChanges();
    key('ArrowDown');
    expect(f.componentInstance.value()).toBe(0);
    expect(key('a').defaultPrevented).toBe(false);
  });

  it('follows the model from outside, and can be disabled', () => {
    const { f, input } = render();
    f.componentInstance.value.set(7);
    f.componentInstance.disabled.set(true);
    f.detectChanges();
    expect(input.value).toBe('7');
    expect(input.disabled).toBe(true);
  });

  describe('money, suffix, buttons and forms', () => {
    @Component({
      imports: [KometaNumber, ReactiveFormsModule],
      template: `<k-number inputId="amt" [money]="true" suffix="so'm" [buttons]="true" [step]="1000" ariaLabel="Amount" [formControl]="ctl" />`,
    })
    class FormHost { ctl = new FormControl<number | null>(1250000); }

    function renderForm() {
      const f = TestBed.createComponent(FormHost);
      f.detectChanges();
      const el = f.nativeElement as HTMLElement;
      const input = el.querySelector('input') as HTMLInputElement;
      return { f, el, input, type: (t: string) => { input.value = t; input.dispatchEvent(new Event('input')); f.detectChanges(); } };
    }

    it('groups money with a no-break space, floors it at 0, and carries the id and the unit', () => {
      const { el, input } = renderForm();
      expect(input.value).toBe(new Intl.NumberFormat('ru-RU').format(1250000));
      expect(input.id).toBe('amt');
      expect(el.querySelector('.suf')?.textContent).toBe("so'm");
    });

    it('writes whole numbers to the control, cuts a fraction, and is null when emptied', () => {
      const { f, type } = renderForm();
      type('1500.9');
      expect(f.componentInstance.ctl.value).toBe(1500);
      type('');
      expect(f.componentInstance.ctl.value).toBeNull();
    });

    it('steps with the circles and follows setDisabledState', () => {
      const { f, el } = renderForm();
      const [minus, plus] = Array.from(el.querySelectorAll<HTMLButtonElement>('.step'));
      plus.click();
      expect(f.componentInstance.ctl.value).toBe(1251000);
      minus.click();
      minus.click();
      expect(f.componentInstance.ctl.value).toBe(1249000);
      f.componentInstance.ctl.disable();
      f.detectChanges();
      expect(el.querySelector('input')!.disabled).toBe(true);
      expect(plus.disabled).toBe(true);
    });
  });
});
