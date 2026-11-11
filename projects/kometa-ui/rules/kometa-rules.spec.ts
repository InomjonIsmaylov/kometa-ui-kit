import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaRule, KometaRules } from './kometa-rules';

@Component({
  imports: [KometaRules],
  template: `<k-rules [value]="value()" [rules]="rules" doneLabel="met" ariaLabel="Password needs" />`,
})
class Host {
  value = signal('');
  rules: KometaRule[] = [
    { label: '8 letters', test: (v) => v.length >= 8 },
    { label: 'a number', test: /\d/g },
    { label: 'a capital', test: '[A-Z]' },
  ];
}

describe('KometaRules', () => {
  function render() {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const el = f.nativeElement.querySelector('k-rules') as HTMLElement;
    const met = () => Array.from(el.querySelectorAll('li.ok')).map((li) => li.firstChild!.textContent);
    const type = (v: string) => {
      f.componentInstance.value.set(v);
      f.detectChanges();
    };
    return { el, met, type };
  }

  it('lists every rule, none met on an empty value', () => {
    const { el, met } = render();
    expect(el.querySelectorAll('li').length).toBe(3);
    expect(met()).toEqual([]);
    expect(el.querySelector('ul')!.getAttribute('aria-label')).toBe('Password needs');
  });

  it('strikes each rule as it is met, from a function or a pattern', () => {
    const { met, type } = render();
    type('abc1');
    expect(met()).toEqual(['a number']);
    type('abcdefg1X');
    expect(met()).toEqual(['8 letters', 'a number', 'a capital']);
  });

  it('keeps a global pattern stable across keystrokes', () => {
    const { met, type } = render();
    type('a1');
    type('a12');
    type('a123');
    expect(met()).toContain('a number');
  });

  it('tells a screen reader which rules are met', () => {
    const { el, type } = render();
    type('1');
    expect(el.querySelector('li.ok .sr')!.textContent).toBe(', met');
    expect(el.querySelectorAll('.sr').length).toBe(1);
  });
});
