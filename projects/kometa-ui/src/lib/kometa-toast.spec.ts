import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaToast, KometaToastItem } from './kometa-toast';

@Component({
  imports: [KometaToast],
  template: `<k-toast [items]="items()" (dismiss)="gone.push($event); items.set(items().filter((i) => i.id !== $event))" />`,
})
class Host {
  items = signal<KometaToastItem[]>([]);
  gone: number[] = [];
}

describe('KometaToast', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function render() {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const root = f.nativeElement as HTMLElement;
    const add = (...its: Partial<KometaToastItem>[]) => {
      f.componentInstance.items.update((l) => [...l, ...its.map((i, n) => ({ id: l.length + n + 1, kind: 'success' as const, text: 'Saved', life: 4000, ...i }))]);
      f.detectChanges();
    };
    return { f, root, add, pills: () => [...root.querySelectorAll<HTMLElement>('.t')] };
  }

  it('draws one pill per item with its words, and a status role (alert for an error)', () => {
    const { add, pills } = render();
    add({ text: 'Saved' }, { kind: 'error', text: 'Could not save' }, { kind: 'info', text: 'Syncing' });
    expect(pills().map((p) => p.querySelector('.text')?.textContent)).toEqual(['Saved', 'Could not save', 'Syncing']);
    expect(pills().map((p) => p.getAttribute('role'))).toEqual(['status', 'alert', 'status']);
    expect(pills()[1].classList.contains('error')).toBe(true);
  });

  it('asks the caller to drop an item when its time is up, after the leave', () => {
    const { f, add, pills } = render();
    add({ life: 1000 });
    vi.advanceTimersByTime(1000);
    f.detectChanges();
    expect(pills()[0].classList.contains('out')).toBe(true);
    expect(f.componentInstance.gone).toEqual([]);
    vi.advanceTimersByTime(300);
    f.detectChanges();
    expect(f.componentInstance.gone).toEqual([1]);
    expect(pills().length).toBe(0);
  });

  it('keeps its time while held under the pointer and gives it at least a moment after', () => {
    const { f, add, pills } = render();
    add({ life: 1000 });
    pills()[0].dispatchEvent(new Event('pointerenter'));
    f.detectChanges();
    expect(pills()[0].classList.contains('hold')).toBe(true);
    vi.advanceTimersByTime(5000);
    f.detectChanges();
    expect(f.componentInstance.gone).toEqual([]);
    pills()[0].dispatchEvent(new Event('pointerleave'));
    f.detectChanges();
    vi.advanceTimersByTime(1400);
    expect(pills()[0].classList.contains('out')).toBe(false);
    vi.advanceTimersByTime(200 + 300);
    f.detectChanges();
    expect(f.componentInstance.gone).toEqual([1]);
  });

  it('lets a press dismiss it at once', () => {
    const { f, add, pills } = render();
    add({});
    pills()[0].click();
    vi.advanceTimersByTime(300);
    f.detectChanges();
    expect(f.componentInstance.gone).toEqual([1]);
  });

  it('drains a hairline over the item\'s own life and sits in the top layer', () => {
    const { root, add } = render();
    add({ life: 2500 });
    expect((root.querySelector('.drain') as HTMLElement).style.getPropertyValue('--life')).toBe('2500ms');
    expect(root.querySelector('.thread')?.getAttribute('popover')).toBe('manual');
    expect(root.querySelector('.thread')?.getAttribute('aria-live')).toBe('polite');
  });
});
