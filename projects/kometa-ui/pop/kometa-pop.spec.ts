import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaPop } from './kometa-pop';

@Component({
  imports: [KometaPop],
  template: `
    <button class="anchor" type="button" (click)="pop.toggle($event)">Open</button>
    <k-pop #pop ariaLabel="Shop" [width]="240" [focusOnShow]="focus()" [(open)]="open" (opened)="opened = opened + 1">
      <button class="first" type="button">One</button>
      <button class="second" type="button" (click)="pop.hide(true)">Two</button>
    </k-pop>
    <button class="elsewhere" type="button">Elsewhere</button>
  `,
})
class Host {
  open = signal(false);
  focus = signal(true);
  opened = 0;
}

describe('KometaPop', () => {
  function render() {
    const f = TestBed.createComponent(Host);
    document.body.appendChild(f.nativeElement);
    f.detectChanges();
    const el = f.nativeElement as HTMLElement;
    const q = <T extends HTMLElement>(s: string) => el.querySelector(s) as T;
    const panel = q('.pop');
    const settle = async () => { f.detectChanges(); await f.whenStable(); f.detectChanges(); };
    return { f, el, q, panel, settle };
  }

  it('is a named dialog of the width asked for, hidden until opened', async () => {
    const { f, q, panel, settle } = render();
    expect(panel.getAttribute('role')).toBe('dialog');
    expect(panel.getAttribute('aria-label')).toBe('Shop');
    expect(panel.style.width).toBe('240px');
    expect(f.componentInstance.open()).toBe(false);
    q<HTMLButtonElement>('.anchor').click();
    await settle();
    expect(f.componentInstance.open()).toBe(true);
  });

  it('toggles on its anchor and focuses the first control', async () => {
    const { f, q, settle } = render();
    q<HTMLButtonElement>('.anchor').click();
    await settle();
    expect(document.activeElement).toBe(q('.first'));
    expect(f.componentInstance.opened).toBe(1);
    q<HTMLButtonElement>('.anchor').click();
    await settle();
    expect(f.componentInstance.open()).toBe(false);
  });

  it('leaves focus alone when focusOnShow is off', async () => {
    const { f, q, settle } = render();
    f.componentInstance.focus.set(false);
    f.detectChanges();
    q<HTMLButtonElement>('.anchor').focus();
    q<HTMLButtonElement>('.anchor').click();
    await settle();
    expect(document.activeElement).toBe(q('.anchor'));
  });

  it('closes on Escape and hands focus back to the button', async () => {
    const { f, q, settle } = render();
    q<HTMLButtonElement>('.anchor').click();
    await settle();
    q<HTMLButtonElement>('.first').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await settle();
    expect(f.componentInstance.open()).toBe(false);
    expect(document.activeElement).toBe(q('.anchor'));
  });

  it('closes on a click outside, not on one inside or on the anchor', async () => {
    const { f, q, settle } = render();
    q<HTMLButtonElement>('.anchor').click();
    await settle();
    q<HTMLButtonElement>('.first').dispatchEvent(new Event('pointerdown', { bubbles: true }));
    q<HTMLButtonElement>('.anchor').dispatchEvent(new Event('pointerdown', { bubbles: true }));
    await settle();
    expect(f.componentInstance.open()).toBe(true);
    q<HTMLButtonElement>('.elsewhere').dispatchEvent(new Event('pointerdown', { bubbles: true }));
    await settle();
    expect(f.componentInstance.open()).toBe(false);
  });

  it('can be closed from inside, handing focus back', async () => {
    const { f, q, settle } = render();
    q<HTMLButtonElement>('.anchor').click();
    await settle();
    q<HTMLButtonElement>('.second').click();
    await settle();
    expect(f.componentInstance.open()).toBe(false);
    expect(document.activeElement).toBe(q('.anchor'));
  });

  it('closes when focus moves out of the panel to somewhere else', async () => {
    const { f, q, settle } = render();
    q<HTMLButtonElement>('.anchor').click();
    await settle();
    q<HTMLButtonElement>('.first').dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: q('.elsewhere') }));
    await settle();
    expect(f.componentInstance.open()).toBe(false);
  });
});
