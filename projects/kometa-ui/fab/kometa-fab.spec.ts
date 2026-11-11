import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaFab, KometaFabAction } from './kometa-fab';

@Component({
  imports: [KometaFab],
  template: `<k-fab [actions]="actions" ariaLabel="New" (picked)="got = $event" />`,
})
class Host {
  actions: KometaFabAction[] = [{ label: 'Visit', value: 'visit' }, { label: 'Client' }, { label: 'Break', disabled: true }];
  got: KometaFabAction | null = null;
}

describe('KometaFab', () => {
  function render() {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const el = f.nativeElement.querySelector('k-fab') as HTMLElement;
    document.body.appendChild(f.nativeElement);
    const fab = el.querySelector('.fab') as HTMLButtonElement;
    const words = () => [...el.querySelectorAll<HTMLButtonElement>('.word')];
    const press = (key: string) => {
      (document.activeElement as HTMLElement).dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
      f.detectChanges();
    };
    return { f, el, fab, words, press };
  }

  it('opens a menu of words and focuses the one nearest the button', async () => {
    const { f, el, fab, words } = render();
    expect(fab.getAttribute('aria-expanded')).toBe('false');
    fab.click();
    f.detectChanges();
    await f.whenStable();
    expect(el.classList).toContain('open');
    expect(fab.getAttribute('aria-expanded')).toBe('true');
    expect(el.querySelector('[role=menu]')!.getAttribute('aria-label')).toBe('New');
    expect(words().map((w) => w.textContent)).toEqual(['Visit', 'Client', 'Break']);
    expect(document.activeElement).toBe(words()[1]);
  });

  it('moves with the arrows, skipping disabled words, and picks one', async () => {
    const { f, el, fab, words, press } = render();
    fab.click();
    f.detectChanges();
    await f.whenStable();
    press('ArrowDown');
    expect(document.activeElement).toBe(words()[0]);
    press('ArrowUp');
    expect(document.activeElement).toBe(words()[1]);
    words()[0].click();
    f.detectChanges();
    expect(f.componentInstance.got!.value).toBe('visit');
    expect(el.classList).not.toContain('open');
    expect(document.activeElement).toBe(fab);
  });

  it('closes on Escape and on the dimmed page', async () => {
    const { f, el, fab, press } = render();
    fab.click();
    f.detectChanges();
    await f.whenStable();
    press('Escape');
    expect(el.classList).not.toContain('open');
    expect(document.activeElement).toBe(fab);
    fab.click();
    f.detectChanges();
    (el.querySelector('.scrim') as HTMLElement).click();
    f.detectChanges();
    expect(el.classList).not.toContain('open');
  });
});
