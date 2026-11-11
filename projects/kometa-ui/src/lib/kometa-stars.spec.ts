import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaStars } from './kometa-stars';

@Component({
  imports: [KometaStars],
  template: `<kometa-stars [value]="value()" [label]="label()" />`,
})
class Host {
  value = signal(4);
  label = signal('4 / 5');
}

describe('KometaStars', () => {
  function render(value: number, label = '4 / 5') {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.value.set(value);
    fixture.componentInstance.label.set(label);
    fixture.detectChanges();
    return fixture.nativeElement.querySelector('kometa-stars') as HTMLElement;
  }

  function counts(el: HTMLElement) {
    const stars = [...el.querySelectorAll('svg')];
    return {
      filled: stars.filter((star) => star.getAttribute('data-fill') === 'filled').length,
      outline: stars.filter((star) => star.getAttribute('data-fill') === 'outline').length,
    };
  }

  it('draws four filled stars and one outline for a value of 4', () => {
    const el = render(4, '4 / 5');
    expect(el.getAttribute('aria-label')).toBe('4 / 5');
    expect(counts(el)).toEqual({ filled: 4, outline: 1 });
    expect(el.querySelector('svg path')).not.toBeNull();
    expect(el.querySelector('link, i, .pi')).toBeNull();
  });

  it('fills whole stars up to the floor and clamps to 0–5', () => {
    expect(counts(render(4.8))).toEqual({ filled: 4, outline: 1 });
    expect(counts(render(9))).toEqual({ filled: 5, outline: 0 });
    expect(counts(render(-2))).toEqual({ filled: 0, outline: 5 });
  });
});

@Component({ imports: [KometaStars], template: `<kometa-stars [value]="7" [max]="10" [size]="24" label="x" />` })
class MaxHost {}

describe('KometaStars max and size', () => {
  it('draws `max` stars, clamps to it, and sets the size', () => {
    const f = TestBed.createComponent(MaxHost);
    f.detectChanges();
    const el = f.nativeElement.querySelector('kometa-stars') as HTMLElement;
    expect(el.querySelectorAll('svg').length).toBe(10);
    expect(el.querySelectorAll('svg[data-fill="filled"]').length).toBe(7);
    expect(el.style.getPropertyValue('--stars-size')).toBe('24px');
  });
});
