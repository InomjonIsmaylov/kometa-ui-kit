import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaContext, KometaContextItem } from './kometa-context';

@Component({
  imports: [KometaContext],
  template: `<k-context [items]="items" (picked)="got = $event.label"><button class="row">Row</button></k-context>`,
})
class Host {
  got = '';
  items: (KometaContextItem | null)[] = [
    { label: 'Rename', shortcut: 'F2' },
    { label: 'Archive', disabled: true },
    { label: 'Duplicate', shortcut: 'Ctrl D' },
    null,
    { label: 'Delete', danger: true },
  ];
}

describe('KometaContext', () => {
  async function render() {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const el = f.nativeElement.querySelector('k-context') as HTMLElement;
    const row = el.querySelector('.row') as HTMLButtonElement;
    const items = () => Array.from(el.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'));
    const rightClick = async () => {
      row.dispatchEvent(new MouseEvent('contextmenu', { clientX: 20, clientY: 30, bubbles: true, cancelable: true }));
      f.detectChanges();
      await f.whenStable();
    };
    const key = async (target: HTMLElement, k: string, shiftKey = false) => {
      target.dispatchEvent(new KeyboardEvent('keydown', { key: k, shiftKey, bubbles: true, cancelable: true }));
      f.detectChanges();
      await f.whenStable();
    };
    return { f, el, row, items, rightClick, key };
  }

  it('opens a menu at the pointer on right-click, with shortcuts, a divider and a red item', async () => {
    const { el, items, rightClick } = await render();
    expect(items().length).toBe(0);
    await rightClick();
    expect(items().map((b) => b.firstChild!.textContent)).toEqual(['Rename', 'Archive', 'Duplicate', 'Delete']);
    expect(items()[0].querySelector('.key')!.textContent).toBe('F2');
    expect(items()[3].classList.contains('danger')).toBe(true);
    expect(el.querySelectorAll('hr[role="separator"]').length).toBe(1);
    const menu = el.querySelector('[role="menu"]') as HTMLElement;
    expect(menu.style.left).toBe('20px');
    expect(menu.style.top).toBe('30px');
    expect(document.activeElement).toBe(items()[0]);
  });

  it('moves with the arrows past disabled items and wraps', async () => {
    const { items, rightClick, key } = await render();
    await rightClick();
    await key(items()[0], 'ArrowDown');
    expect(document.activeElement!.textContent).toBe('DuplicateCtrl D');
    await key(document.activeElement as HTMLElement, 'ArrowDown');
    await key(document.activeElement as HTMLElement, 'ArrowDown');
    expect(document.activeElement!.textContent).toBe('RenameF2');
    await key(document.activeElement as HTMLElement, 'End');
    expect(document.activeElement!.textContent).toBe('Delete');
  });

  it('emits the picked item and closes, handing focus back', async () => {
    const { f, row, items, key } = await render();
    row.focus();
    await key(row, 'F10', true);
    items()[2].click();
    f.detectChanges();
    expect(f.componentInstance.got).toBe('Duplicate');
    expect(items().length).toBe(0);
    expect(document.activeElement).toBe(row);
  });

  it('closes on Escape and on a click outside', async () => {
    const { f, row, items, rightClick, key } = await render();
    row.focus();
    await rightClick();
    await key(items()[0], 'Escape');
    expect(items().length).toBe(0);
    expect(document.activeElement).toBe(row);
    await rightClick();
    document.body.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    f.detectChanges();
    expect(items().length).toBe(0);
  });
});
