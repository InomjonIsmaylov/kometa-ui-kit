import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaCode } from './kometa-code';

@Component({
  imports: [KometaCode],
  template: `<kometa-code [(value)]="code" />`,
})
class Host {
  code = signal('');
}

describe('KometaCode', () => {
  function setup() {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const root = f.nativeElement.querySelector('kometa-code') as HTMLElement;
    const inputs = [...root.querySelectorAll('input')] as HTMLInputElement[];
    return { f, root, inputs };
  }

  it('defaults to six numeric cells and marks the first for a one-time code', () => {
    const { inputs } = setup();
    expect(inputs.length).toBe(6);
    for (const input of inputs) {
      expect(input.getAttribute('inputmode')).toBe('numeric');
      expect(input.getAttribute('maxlength')).toBe('1');
    }
    expect(inputs[0].getAttribute('autocomplete')).toBe('one-time-code');
    expect(inputs[1].getAttribute('autocomplete')).toBeNull();
  });

  it('writes a digit and focuses the next cell', () => {
    const { f, inputs } = setup();
    typeDigit(inputs[0], '7');
    f.detectChanges();
    expect(f.componentInstance.code()).toBe('7');
    expect(document.activeElement).toBe(inputs[1]);
  });

  it('backspace on an empty cell focuses the previous and clears it', () => {
    const { f, inputs } = setup();
    f.componentInstance.code.set('12');
    f.detectChanges();
    inputs[2].focus();
    inputs[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true }));
    f.detectChanges();
    expect(document.activeElement).toBe(inputs[1]);
    expect(inputs[1].value).toBe('');
    expect(f.componentInstance.code()).toBe('1');
  });

  it('pastes digits from the focused cell', () => {
    const { f, inputs } = setup();
    f.componentInstance.code.set('1');
    f.detectChanges();
    inputs[1].focus();
    paste(inputs[1], 'a23-4');
    f.detectChanges();
    expect(f.componentInstance.code()).toBe('1234');
    expect(inputs[0].value).toBe('1');
    expect(inputs[1].value).toBe('2');
    expect(inputs[2].value).toBe('3');
    expect(inputs[3].value).toBe('4');
  });

  it('moves the cream underline under the focused cell', () => {
    const { f, root, inputs } = setup();
    stubBox(inputs[2], 72, 28);
    inputs[2].dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    f.detectChanges();
    const line = root.querySelector('.underline') as HTMLElement;
    expect(line).not.toBeNull();
    expect(line.style.transform).toContain('72');
    expect(line.style.width).toBe('28px');
  });
});

function typeDigit(input: HTMLInputElement, digit: string) {
  input.value = digit;
  input.dispatchEvent(new InputEvent('input', { bubbles: true, data: digit, inputType: 'insertText' }));
}

function paste(input: HTMLInputElement, text: string) {
  // jsdom has no ClipboardEvent or DataTransfer. The event still carries clipboardData.getData,
  // which is the surface a real paste uses.
  const event = new Event('paste', { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'clipboardData', {
    configurable: true,
    value: {
      getData: (kind: string) => (kind === 'text' || kind === 'text/plain' ? text : ''),
    },
  });
  input.dispatchEvent(event);
}

function stubBox(el: HTMLElement, left: number, width: number) {
  Object.defineProperty(el, 'offsetLeft', { configurable: true, value: left });
  Object.defineProperty(el, 'offsetWidth', { configurable: true, value: width });
}
