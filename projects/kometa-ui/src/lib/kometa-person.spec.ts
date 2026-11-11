import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaPerson } from './kometa-person';

@Component({
  imports: [KometaPerson],
  template: `<kometa-person [name]="name()" [meta]="meta()" [size]="size()"><a class="trail" href="#">Ochish</a></kometa-person>`,
})
class Host {
  name = signal('Aziz Karimov');
  meta = signal('kecha');
  size = signal<'md' | 'sm'>('md');
}

describe('KometaPerson', () => {
  function render(name: string, meta = '', size: 'md' | 'sm' = 'md') {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.name.set(name);
    fixture.componentInstance.meta.set(meta);
    fixture.componentInstance.size.set(size);
    fixture.detectChanges();
    return fixture.nativeElement.querySelector('kometa-person') as HTMLElement;
  }

  it('shows the initials of the first two words, the name, and the meta line', () => {
    const el = render('Aziz Karimov', 'kecha');
    expect(el.querySelector('.disc')!.textContent!.trim()).toBe('AK');
    expect(el.querySelector('.name')!.textContent!.trim()).toBe('Aziz Karimov');
    expect(el.querySelector('.meta')!.textContent!.trim()).toBe('kecha');
    const disc = getComputedStyle(el.querySelector('.disc') as HTMLElement);
    // The size is a custom property (`--person-disc`) so a host can set any figure; the test DOM leaves var() unresolved.
    expect(disc.width).toBe('var(--person-disc, 36px)');
    expect(disc.borderRadius === '50%' || disc.borderRadius === '18px').toBe(true);
  });

  it('uppercases a single word and omits an empty meta line', () => {
    const el = render('aziz', '');
    expect(el.querySelector('.disc')!.textContent!.trim()).toBe('A');
    expect(el.querySelector('.meta')).toBeNull();
  });

  it('ignores a third word', () => {
    const el = render('Ali Vali Gani');
    expect(el.querySelector('.disc')!.textContent!.trim()).toBe('AV');
  });

  it('renders projected content after the text block, which takes the free width', () => {
    const el = render('Aziz Karimov', 'kecha');
    const trail = el.querySelector('.trail') as HTMLElement;
    const text = el.querySelector('.text') as HTMLElement;
    expect(trail.parentElement).toBe(el);
    expect(text.nextElementSibling).toBe(trail);
    expect(getComputedStyle(text).flexGrow).toBe('1');
    expect(getComputedStyle(el.querySelector('.name') as HTMLElement).textOverflow).toBe('ellipsis');
  });

  it('draws a 28px disc with 12px initials at size sm and keeps the disc aria-hidden', () => {
    const el = render('Aziz Karimov', '', 'sm');
    const disc = el.querySelector('.disc') as HTMLElement;
    const style = getComputedStyle(disc);
    expect(getComputedStyle(el).getPropertyValue('--person-disc')).toBe('28px');
    expect(style.width).toBe('var(--person-disc, 36px)');
    expect(style.fontSize).toBe('12px');
    expect(disc.getAttribute('aria-hidden')).toBe('true');
  });
});
