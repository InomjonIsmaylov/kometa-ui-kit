import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { KometaTree, KometaTreeNode } from './kometa-tree';

@Component({
  imports: [KometaTree],
  template: `<k-tree [nodes]="nodes" [(path)]="path" ariaLabel="Settings" (picked)="got = $event" />`,
})
class Host {
  nodes: KometaTreeNode[] = [
    { label: 'Services', children: [{ label: 'Haircut' }, { label: 'Beard trim' }] },
    { label: 'Team', children: [{ label: 'Masters', children: [{ label: 'Aziza' }] }, { label: 'Roles' }] },
    { label: 'Shop page' },
  ];
  path = signal<number[]>([]);
  got: KometaTreeNode | null = null;
}

describe('KometaTree', () => {
  function render() {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const el = f.nativeElement.querySelector('k-tree') as HTMLElement;
    const cols = () => Array.from(el.querySelectorAll('ul')).map((u) => Array.from(u.querySelectorAll('button')).map((b) => b.textContent!.trim()));
    const btn = (d: number, i: number) => el.querySelectorAll('ul')[d].querySelectorAll('button')[i] as HTMLButtonElement;
    const press = (b: HTMLElement, key: string) => {
      b.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
      f.detectChanges();
    };
    return { f, el, cols, btn, press };
  }

  it('shows the root column and marks branches as expandable', () => {
    const { el, cols, btn } = render();
    expect(cols()).toEqual([['Services', 'Team', 'Shop page']]);
    expect(btn(0, 0).getAttribute('aria-expanded')).toBe('false');
    expect(btn(0, 2).hasAttribute('aria-expanded')).toBe(false);
    expect(el.querySelector('[role="group"]')!.getAttribute('aria-label')).toBe('Settings');
  });

  it('opens a branch as the next column and replaces it when a sibling is picked', () => {
    const { f, cols, btn } = render();
    btn(0, 1).click();
    f.detectChanges();
    expect(cols()[1]).toEqual(['Masters', 'Roles']);
    expect(btn(0, 1).getAttribute('aria-expanded')).toBe('true');
    btn(1, 0).click();
    f.detectChanges();
    expect(cols().length).toBe(3);
    btn(0, 0).click();
    f.detectChanges();
    expect(cols()).toEqual([['Services', 'Team', 'Shop page'], ['Haircut', 'Beard trim']]);
    expect(f.componentInstance.path()).toEqual([0]);
  });

  it('marks a picked leaf as current and emits it', () => {
    const { f, btn } = render();
    btn(0, 2).click();
    f.detectChanges();
    expect(btn(0, 2).getAttribute('aria-current')).toBe('true');
    expect(f.componentInstance.got!.label).toBe('Shop page');
  });

  it('starts from a bound path', () => {
    const { f, cols } = render();
    f.componentInstance.path.set([1, 0]);
    f.detectChanges();
    expect(cols()[2]).toEqual(['Aziza']);
  });

  it('moves with the arrow keys', async () => {
    const { f, btn, press } = render();
    btn(0, 0).focus();
    press(btn(0, 0), 'ArrowDown');
    expect(document.activeElement).toBe(btn(0, 1));
    press(btn(0, 1), 'ArrowRight');
    await f.whenStable();
    expect(document.activeElement).toBe(btn(1, 0));
    press(btn(1, 0), 'ArrowLeft');
    expect(document.activeElement).toBe(btn(0, 1));
  });

  it('replays the slide-in for a new column without NG0956', () => {
    const { f, btn } = render();
    const warn = vi.spyOn(console, 'warn');
    btn(0, 0).click();
    f.detectChanges();
    btn(0, 1).click();
    f.detectChanges();
    expect(warn.mock.calls.flat().join(' ')).not.toContain('NG0956');
    warn.mockRestore();
  });
});
