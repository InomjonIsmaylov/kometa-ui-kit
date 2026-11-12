import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaTip } from './kometa-tip';

@Component({
  imports: [KometaTip],
  template: `
    <button class="icon" type="button" aria-label="Delete" [kometaTip]="name()" [kometaTipSub]="sub()">x</button>
    <span class="cell" [kometaTip]="'Last visit 12 Oct'">12 Oct</span>
    <button class="off" type="button" [kometaTip]="null">y</button>
  `,
})
class Host {
  name = signal('Delete');
  sub = signal('Removes it for good');
}

describe('KometaTip', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    document.querySelectorAll('.kometa-tip').forEach((n) => n.remove());
  });

  function render() {
    const f = TestBed.createComponent(Host);
    document.body.appendChild(f.nativeElement);
    f.detectChanges();
    const el = f.nativeElement as HTMLElement;
    const q = <T extends HTMLElement>(s: string) => el.querySelector(s) as T;
    const tip = () => document.querySelector('.kometa-tip') as HTMLElement | null;
    const pointer = (target: HTMLElement, type: string, pointerType = 'mouse') => {
      const e = new Event(type, { bubbles: type !== 'pointerenter' && type !== 'pointerleave' });
      Object.defineProperty(e, 'pointerType', { value: pointerType });
      target.dispatchEvent(e);
    };
    return { f, q, tip, pointer };
  }

  it('shows after a short pause on a mouse hover, as a tooltip described-by the element', () => {
    const { q, tip, pointer } = render();
    pointer(q('.icon'), 'pointerenter');
    expect(tip()).toBeNull();
    vi.advanceTimersByTime(400);
    expect(tip()!.getAttribute('role')).toBe('tooltip');
    expect(tip()!.querySelector('b')!.textContent).toBe('Delete');
    expect(tip()!.querySelector('span')!.textContent).toBe('Removes it for good');
    expect(q('.icon').getAttribute('aria-describedby')).toBe(tip()!.id);
  });

  it('hides on leave and lets go of the described-by', () => {
    const { q, tip, pointer } = render();
    pointer(q('.icon'), 'pointerenter');
    vi.advanceTimersByTime(400);
    pointer(q('.icon'), 'pointerleave');
    vi.advanceTimersByTime(150);
    expect(q('.icon').hasAttribute('aria-describedby')).toBe(false);
    expect(tip()!.matches(':popover-open')).toBe(false);
  });

  it('stays while the pointer moves onto the tip, and hides when it leaves the tip', () => {
    const { q, tip, pointer } = render();
    const up = () => q('.icon').getAttribute('aria-describedby') === tip()!.id;
    pointer(q('.icon'), 'pointerenter');
    vi.advanceTimersByTime(400);
    expect(getComputedStyle(tip()!).pointerEvents).not.toBe('none');
    pointer(q('.icon'), 'pointerleave');
    pointer(tip()!, 'pointerenter');
    vi.advanceTimersByTime(1000);
    expect(up()).toBe(true);
    pointer(tip()!, 'pointerleave');
    expect(up()).toBe(false);
  });

  it('Escape hides it even when focus is elsewhere', () => {
    const { q, tip, pointer } = render();
    pointer(q('.icon'), 'pointerenter');
    vi.advanceTimersByTime(400);
    expect(q('.icon').hasAttribute('aria-describedby')).toBe(true);
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(q('.icon').hasAttribute('aria-describedby')).toBe(false);
  });

  it('skips the pause when moving to a neighbour straight after', () => {
    const { q, tip, pointer } = render();
    pointer(q('.icon'), 'pointerenter');
    vi.advanceTimersByTime(400);
    pointer(q('.icon'), 'pointerleave');
    pointer(q('.cell'), 'pointerenter');
    vi.advanceTimersByTime(0);
    expect(tip()!.querySelector('b')!.textContent).toBe('Last visit 12 Oct');
    expect(tip()!.querySelector('span')).toBeNull();
  });

  it('a pressed mouse cancels a tip that has not shown yet', () => {
    const { q, tip, pointer } = render();
    pointer(q('.icon'), 'pointerenter');
    pointer(q('.icon'), 'pointerdown');
    vi.advanceTimersByTime(400);
    expect(tip()).toBeNull();
  });

  it('shows nothing for a null or empty name', () => {
    const { q, tip, pointer } = render();
    pointer(q('.off'), 'pointerenter');
    vi.advanceTimersByTime(400);
    expect(tip()).toBeNull();
  });

  it('a touch on a plain element shows it for two seconds; a touch on a button runs the button and shows nothing', () => {
    const { q, tip, pointer } = render();
    pointer(q('.icon'), 'pointerdown', 'touch');
    expect(tip()).toBeNull();
    pointer(q('.cell'), 'pointerdown', 'touch');
    expect(tip()!.querySelector('b')!.textContent).toBe('Last visit 12 Oct');
    vi.advanceTimersByTime(2100);
    expect(q('.cell').hasAttribute('aria-describedby')).toBe(false);
  });

  it('Escape hides it', () => {
    const { q, tip, pointer } = render();
    pointer(q('.icon'), 'pointerenter');
    vi.advanceTimersByTime(400);
    q('.icon').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(q('.icon').hasAttribute('aria-describedby')).toBe(false);
    expect(tip()!.matches(':popover-open')).toBe(false);
  });

  it('follows the words while it is up', () => {
    const { f, q, tip, pointer } = render();
    pointer(q('.icon'), 'pointerenter');
    vi.advanceTimersByTime(400);
    f.componentInstance.name.set('Remove');
    f.detectChanges();
    expect(tip()!.querySelector('b')!.textContent).toBe('Remove');
  });
});
