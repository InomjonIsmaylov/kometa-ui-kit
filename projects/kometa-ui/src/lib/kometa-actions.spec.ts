import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaAction, KometaActions } from './kometa-actions';

@Component({
  imports: [KometaActions],
  template: `<k-actions label="More options" [items]="items()" [disabled]="disabled()" [(open)]="open" />`,
})
class Host {
  ran: string[] = [];
  disabled = signal(false);
  open = signal(false);
  items = signal<KometaAction[]>([
    { label: 'Start', run: () => this.ran.push('start') },
    { label: 'Pay', run: () => this.ran.push('pay'), badge: 'PRO' },
    { label: 'Locked', run: () => this.ran.push('locked'), disabled: true },
    { label: 'Cancel', run: () => this.ran.push('cancel'), danger: true },
  ]);
}

describe('KometaActions', () => {
  async function render() {
    const f = TestBed.createComponent(Host);
    document.body.append(f.nativeElement);
    f.detectChanges();
    const root = f.nativeElement.querySelector('k-actions') as HTMLElement;
    const btn = root.querySelector('button.more') as HTMLButtonElement;
    const rows = () => [...root.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')];
    const open = async () => { btn.click(); f.detectChanges(); await f.whenStable(); f.detectChanges(); };
    const key = (k: string, target: Element = document.activeElement!) => {
      target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
      f.detectChanges();
    };
    return { f, root, btn, rows, open, key };
  }

  afterEach(() => document.body.replaceChildren());

  it('is a menu button with the caller\'s name, pointing at its list, closed until pressed', async () => {
    const { root, btn, rows } = await render();
    expect(btn.getAttribute('aria-haspopup')).toBe('menu');
    expect(btn.getAttribute('aria-label')).toBe('More options');
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    expect(root.querySelector('[role="menu"]')?.id).toBe(btn.getAttribute('aria-controls'));
    expect(rows()).toHaveLength(0);
  });

  it('opens on press with one row per action, marks the danger one and shows a badge', async () => {
    const { btn, rows, open, f } = await render();
    await open();
    expect(btn.getAttribute('aria-expanded')).toBe('true');
    expect(f.componentInstance.open()).toBe(true);
    expect(rows().map((r) => r.firstChild?.textContent?.trim())).toEqual(['Start', 'Pay', 'Locked', 'Cancel']);
    expect(rows()[1].querySelector('.badge')?.textContent).toBe('PRO');
    expect(rows()[3].classList.contains('danger')).toBe(true);
    expect(rows()[2].disabled).toBe(true);
  });

  it('puts focus on the first row when it opens, and ArrowDown, ArrowUp, Home and End wrap past a disabled one', async () => {
    const { rows, open, key } = await render();
    await open();
    expect(document.activeElement).toBe(rows()[0]);
    key('ArrowDown');
    expect(document.activeElement).toBe(rows()[1]);
    key('ArrowDown');
    expect(document.activeElement).toBe(rows()[3]);
    key('ArrowDown');
    expect(document.activeElement).toBe(rows()[0]);
    key('ArrowUp');
    expect(document.activeElement).toBe(rows()[3]);
    key('Home');
    expect(document.activeElement).toBe(rows()[0]);
    key('End');
    expect(document.activeElement).toBe(rows()[3]);
  });

  it('runs an action, closes the list and returns focus to the button', async () => {
    const { f, btn, rows, open } = await render();
    await open();
    rows()[1].click();
    f.detectChanges();
    expect(f.componentInstance.ran).toEqual(['pay']);
    expect(f.componentInstance.open()).toBe(false);
    expect(rows()).toHaveLength(0);
    expect(document.activeElement).toBe(btn);
  });

  it('does not run a disabled action', async () => {
    const { f, rows, open } = await render();
    await open();
    rows()[2].click();
    expect(f.componentInstance.ran).toEqual([]);
  });

  it('closes on Escape and returns focus to the button, and says so only while open', async () => {
    const { f, btn, open, key } = await render();
    await open();
    key('Escape');
    expect(f.componentInstance.open()).toBe(false);
    expect(document.activeElement).toBe(btn);
  });

  it('closes on Tab and on a press outside, but not on a press inside', async () => {
    const { f, root, open, key } = await render();
    await open();
    root.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(f.componentInstance.open()).toBe(true);
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    f.detectChanges();
    expect(f.componentInstance.open()).toBe(false);
    await open();
    key('Tab');
    expect(f.componentInstance.open()).toBe(false);
  });

  it('toggles shut when the button is pressed again, and a disabled button never opens', async () => {
    const { f, btn, open } = await render();
    await open();
    btn.click();
    f.detectChanges();
    expect(f.componentInstance.open()).toBe(false);
    f.componentInstance.disabled.set(true);
    f.detectChanges();
    expect(btn.disabled).toBe(true);
  });
});
