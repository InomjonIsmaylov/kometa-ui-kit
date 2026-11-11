import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaAvatars } from './kometa-avatars';

@Component({
  imports: [KometaAvatars],
  template: `<k-avatars [people]="people()" [max]="max()" ariaLabel="Coming" moreLabel="and {n} others" />`,
})
class Host {
  people = signal(['Aziza Karimova', 'Dilshod S', 'Malika R', 'Zafar T', 'Nodira B', 'Umid O'].map((name) => ({ name })));
  max = signal(4);
}

describe('KometaAvatars', () => {
  function render() {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const el = f.nativeElement.querySelector('k-avatars') as HTMLElement;
    return { f, el };
  }

  it('shows max discs and a +N disc for the rest', () => {
    const { el } = render();
    expect(el.querySelectorAll('k-person').length).toBe(4);
    const more = el.querySelector('.more')!;
    expect(more.textContent).toBe('+2');
    expect(more.getAttribute('aria-label')).toBe('and 2 others');
    expect(more.getAttribute('role')).toBe('img');
  });

  it('draws each person bare, named aloud by its initials disc', () => {
    const { el } = render();
    const disc = el.querySelector('k-person .disc')!;
    expect(disc.textContent!.trim()).toBe('AK');
    expect(disc.getAttribute('aria-label')).toBe('Aziza Karimova');
    expect(el.querySelector('k-person .name')).toBeNull();
  });

  it('drops the +N disc when everyone fits', () => {
    const { f, el } = render();
    f.componentInstance.max.set(6);
    f.detectChanges();
    expect(el.querySelectorAll('k-person').length).toBe(6);
    expect(el.querySelector('.more')).toBeNull();
  });

  it('is a labelled group', () => {
    const { el } = render();
    expect(el.getAttribute('role')).toBe('group');
    expect(el.getAttribute('aria-label')).toBe('Coming');
  });

  it('fans the discs out on hover and focus, and stops moving under reduced motion', () => {
    const css = String((KometaAvatars as unknown as { ɵcmp: { styles: string[] } }).ɵcmp.styles).replace(/%NS%/g, '');
    expect(css).toMatch(/:hover/);
    expect(css).toMatch(/:focus-within/);
    expect(css).toMatch(/prefers-reduced-motion: reduce\)[\s\S]*transition: none/);
  });
});
