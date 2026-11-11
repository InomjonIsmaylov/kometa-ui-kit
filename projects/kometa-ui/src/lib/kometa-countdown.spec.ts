import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { KometaCountdown } from './kometa-countdown';

@Component({
  imports: [KometaCountdown],
  template: `<k-countdown [duration]="duration()" [until]="until()" label="to confirm" ariaLabel="Time to confirm" (done)="done = done + 1" />`,
})
class Host {
  duration = signal(20);
  until = signal<Date | number | null>(null);
  done = 0;
}

describe('KometaCountdown', () => {
  beforeEach(() => vi.useFakeTimers({ now: new Date('2026-11-11T10:00:00Z') }));
  afterEach(() => vi.useRealTimers());

  function render() {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const el = f.nativeElement.querySelector('k-countdown') as HTMLElement;
    const fig = () => el.querySelector('.fig')!.textContent!.replace(/\s+/g, ' ').trim();
    const standing = () => el.querySelectorAll('.ticks i:not(.off)').length;
    const tick = (ms: number) => {
      vi.advanceTimersByTime(ms);
      f.detectChanges();
    };
    return { f, el, fig, standing, tick };
  }

  it('starts full with one tick per second', () => {
    const { el, fig, standing } = render();
    expect(fig()).toBe('0:20to confirm');
    expect(el.querySelectorAll('.ticks i').length).toBe(20);
    expect(standing()).toBe(20);
    expect(el.querySelector('[role="timer"]')!.getAttribute('aria-label')).toBe('Time to confirm');
  });

  it('drains a tick each second and emits done once at zero', () => {
    const { f, fig, standing, tick } = render();
    tick(5000);
    expect(fig()).toContain('0:15');
    expect(standing()).toBe(15);
    tick(20000);
    expect(fig()).toContain('0:00');
    expect(standing()).toBe(0);
    tick(3000);
    expect(f.componentInstance.done).toBe(1);
  });

  it('counts to a given end and shows hours when it is far', () => {
    const { f, fig } = render();
    f.componentInstance.duration.set(60);
    f.componentInstance.until.set(Date.now() + (2 * 3600 + 14 * 60 + 5) * 1000);
    f.detectChanges();
    expect(fig()).toContain('2:14:05');
  });

  it('draws 30 ticks above 40 seconds', () => {
    const { f, el, standing, tick } = render();
    f.componentInstance.duration.set(60);
    f.detectChanges();
    expect(el.querySelectorAll('.ticks i').length).toBe(30);
    tick(30000);
    expect(standing()).toBe(15);
  });

  it('stops its timer when destroyed', () => {
    const { f } = render();
    f.destroy();
    expect(vi.getTimerCount()).toBe(0);
  });
});
