import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaMulti } from './kometa-multi';

const SHOPS = [
  { id: 'a', name: 'Chilonzor', colour: '#ff0000' },
  { id: 'b', name: 'Yunusobod', colour: '#00ff00' },
  { id: 'c', name: 'Sergeli', colour: '#0000ff' },
];

@Component({
  imports: [KometaMulti],
  template: `<kometa-multi ariaLabel="Shops" inputId="shops" placeholder="Add a shop" noMatch="Nothing" removeLabel="Remove" summary="Shops: 2" optionLabel="name"
                           optionValue="id" optionDot="colour" [options]="shops" [pill]="pill()" [disabled]="disabled()" [(value)]="value" />`,
})
class Host {
  shops = SHOPS;
  pill = signal(false);
  disabled = signal(false);
  value = signal<string[]>(['a', 'c']);
}

describe('KometaMulti', () => {
  function render(pill = false) {
    const f = TestBed.createComponent(Host);
    f.componentInstance.pill.set(pill);
    f.detectChanges();
    const root = f.nativeElement.querySelector('kometa-multi') as HTMLElement;
    const input = () => root.querySelector('input') as HTMLInputElement;
    const btn = () => root.querySelector('.btn') as HTMLButtonElement;
    const rows = () => [...root.querySelectorAll<HTMLElement>('.opt')];
    const chips = () => [...root.querySelectorAll<HTMLElement>('.chip')].map((c) => c.textContent?.replace('×', '').trim());
    const key = (k: string) => (pill ? btn() : input()).dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
    const type = (text: string) => { input().value = text; input().dispatchEvent(new Event('input')); f.detectChanges(); };
    return { f, root, input, btn, rows, chips, key, type };
  }

  it('shows what is chosen as words with a cross, in the order chosen', () => {
    const { chips, input } = render();
    expect(chips()).toEqual(['Chilonzor', 'Sergeli']);
    expect(input().id).toBe('shops');
    expect(input().getAttribute('role')).toBe('combobox');
    expect(input().placeholder).toBe('');
  });

  it('opens on focus, lists every option with the chosen ones marked and a dot of the colour', () => {
    const { f, input, rows } = render();
    input().dispatchEvent(new Event('focus'));
    f.detectChanges();
    expect(rows().map((r) => r.textContent?.trim())).toEqual(['Chilonzor', 'Yunusobod', 'Sergeli']);
    expect(rows().map((r) => r.getAttribute('aria-selected'))).toEqual(['true', 'false', 'true']);
    expect(rows()[1].querySelector<HTMLElement>('.dot')!.style.background).not.toBe('');
  });

  it('narrows as you type, says when nothing matches', () => {
    const { f, input, rows, type, root } = render();
    input().dispatchEvent(new Event('focus'));
    type('ser');
    expect(rows().map((r) => r.textContent?.trim())).toEqual(['Sergeli']);
    type('zzz');
    expect(rows()).toHaveLength(0);
    expect(root.querySelector('.none')?.textContent).toBe('Nothing');
    expect(f.componentInstance.value()).toEqual(['a', 'c']);
  });

  it('toggles a row with a click and keeps the list open', () => {
    const { f, input, rows, chips } = render();
    input().dispatchEvent(new Event('focus'));
    f.detectChanges();
    rows()[1].click();
    f.detectChanges();
    expect(f.componentInstance.value()).toEqual(['a', 'c', 'b']);
    expect(chips()).toEqual(['Chilonzor', 'Sergeli', 'Yunusobod']);
    expect(rows()).toHaveLength(3);
    rows()[0].click();
    f.detectChanges();
    expect(f.componentInstance.value()).toEqual(['c', 'b']);
  });

  it('removes a choice with its cross', () => {
    const { f, root, chips } = render();
    root.querySelector<HTMLButtonElement>('.chip')!.click();
    f.detectChanges();
    expect(f.componentInstance.value()).toEqual(['c']);
    expect(chips()).toEqual(['Sergeli']);
  });

  it('moves with the arrows, toggles with Enter, takes the last off with Backspace and closes with Escape', () => {
    const { f, input, rows, key } = render();
    input().dispatchEvent(new Event('focus'));
    f.detectChanges();
    key('ArrowDown');
    f.detectChanges();
    key('Enter');
    f.detectChanges();
    expect(f.componentInstance.value()).toEqual(['a', 'c', 'b']);
    key('Backspace');
    f.detectChanges();
    expect(f.componentInstance.value()).toEqual(['a', 'c']);
    key('Escape');
    f.detectChanges();
    expect(rows()).toHaveLength(0);
  });

  it('closes on a click outside', () => {
    const { f, input, rows } = render();
    input().dispatchEvent(new Event('focus'));
    f.detectChanges();
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    f.detectChanges();
    expect(rows()).toHaveLength(0);
  });

  it('as a pill, shows the summary and toggles from the same list', () => {
    const { f, btn, rows, key, root } = render(true);
    expect(root.querySelector('input')).toBeNull();
    expect(btn().textContent?.trim()).toBe('Shops: 2');
    btn().click();
    f.detectChanges();
    expect(btn().getAttribute('aria-expanded')).toBe('true');
    key('ArrowDown');
    f.detectChanges();
    key(' ');
    f.detectChanges();
    expect(f.componentInstance.value()).toEqual(['a', 'c', 'b']);
    expect(rows()).toHaveLength(3);
  });

  it('does not open when disabled', () => {
    const { f, input, rows } = render();
    f.componentInstance.disabled.set(true);
    f.detectChanges();
    input().dispatchEvent(new Event('focus'));
    f.detectChanges();
    expect(rows()).toHaveLength(0);
  });
});
