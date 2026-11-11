import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaStep, KometaTrail } from './kometa-trail';

@Component({
  imports: [KometaTrail, KometaStep],
  template: `
    <k-trail>
      @for (s of steps(); track s.time) {
        <k-step [time]="s.time" [gap]="s.gap"><b>{{ s.word }}</b></k-step>
      }
    </k-trail>
  `,
})
class Host {
  steps = signal<{ time: string; word: string; gap: string | null }[]>([
    { time: '09:58', word: 'Booked', gap: '32 min' },
    { time: '10:30', word: 'Checked in', gap: '4 min' },
    { time: '10:34', word: 'Started', gap: null },
  ]);
}

describe('KometaTrail', () => {
  function render() {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const root = f.nativeElement as HTMLElement;
    return { f, root, steps: () => [...root.querySelectorAll<HTMLElement>('k-step')] };
  }

  it('is a list of steps, each with its time and its projected content', () => {
    const { root, steps } = render();
    expect(root.querySelector('k-trail')?.getAttribute('role')).toBe('list');
    expect(steps().map((s) => s.getAttribute('role'))).toEqual(['listitem', 'listitem', 'listitem']);
    expect(steps().map((s) => s.querySelector('time')?.textContent)).toEqual(['09:58', '10:30', '10:34']);
    expect(steps().map((s) => s.querySelector('.body b')?.textContent)).toEqual(['Booked', 'Checked in', 'Started']);
  });

  it('writes the wait on the line under a step, and draws no line when there is none to say', () => {
    const { steps } = render();
    expect(steps().map((s) => s.querySelector('.gap')?.textContent?.trim() ?? null)).toEqual(['32 min', '4 min', null]);
  });

  it('follows the list when a step arrives', () => {
    const { f, steps } = render();
    f.componentInstance.steps.update((l) => [...l, { time: '11:05', word: 'Paid', gap: null }]);
    f.detectChanges();
    expect(steps().length).toBe(4);
  });

  it('rises in with motion and stands still under reduced motion', () => {
    const css = (KometaStep as unknown as { ɵcmp: { styles: string[] } }).ɵcmp.styles.join('\n');
    expect(css).toContain('k-step-in');
    expect(css).toMatch(/prefers-reduced-motion: reduce\)\s*\{[^}]*animation:\s*none/);
  });
});
