import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaKeys } from './kometa-keys';

@Component({
  imports: [KometaKeys],
  template: `<k-keys [keys]="keys()" [play]="play()" />`,
})
class Host {
  keys = signal<string | string[]>('Ctrl + Shift+P');
  play = signal<'hover' | 'loop' | 'off'>('hover');
}

describe('KometaKeys', () => {
  function render() {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const el = f.nativeElement.querySelector('k-keys') as HTMLElement;
    const keys = () => Array.from(el.querySelectorAll('kbd kbd')).map((k) => k.textContent);
    return { f, el, keys };
  }

  it('splits a string on + into nested kbd keys with separators between', () => {
    const { el, keys } = render();
    expect(keys()).toEqual(['Ctrl', 'Shift', 'P']);
    expect(el.querySelectorAll('.plus').length).toBe(2);
    expect(el.querySelector(':scope > kbd')).not.toBeNull();
  });

  it('takes an array and gives each key its place in the sequence', () => {
    const { f, el, keys } = render();
    f.componentInstance.keys.set(['⌘', 'K']);
    f.detectChanges();
    expect(keys()).toEqual(['⌘', 'K']);
    expect((el.querySelectorAll('kbd kbd')[1] as HTMLElement).style.getPropertyValue('--i')).toBe('1');
    expect(el.style.getPropertyValue('--n')).toBe('2');
  });

  it('reflects the play mode for the CSS', () => {
    const { f, el } = render();
    expect(el.getAttribute('data-play')).toBe('hover');
    f.componentInstance.play.set('loop');
    f.detectChanges();
    expect(el.getAttribute('data-play')).toBe('loop');
  });

  it('plays on hover, focus or loop, and never under reduced motion', () => {
    const css = String((KometaKeys as unknown as { ɵcmp: { styles: string[] } }).ɵcmp.styles).replace(/%NS%/g, '');
    expect(css).toMatch(/data-play=["']?loop/);
    expect(css).toMatch(/:hover/);
    expect(css).toMatch(/:focus-within/);
    expect(css).toMatch(/prefers-reduced-motion: reduce\)[\s\S]*animation: none/);
  });
});
