import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, signal, untracked } from '@angular/core';

/**
 * A figure that counts to its new value instead of jumping, in Syne, with a row of ticks underneath that fills
 * to match when it has a `max`. Change `value` and it counts from where it was (ease-out, `duration` ms). A screen
 * reader hears only the final value, not every step. Reduced motion jumps straight there.
 *
 *     <k-tally [value]="visits()" [max]="60" unit="of 60 visits" />
 *
 * Tests in kometa-tally.spec.ts.
 */
@Component({
  selector: 'k-tally',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: block; }
    .fig {
      display: flex;
      align-items: baseline;
      gap: 8px;
      color: var(--display-ink, #f4efe6);
      font: 700 var(--tally-size, 40px) / 1 var(--font-display, 'Syne'), sans-serif;
      font-variant-numeric: tabular-nums;
      letter-spacing: -0.03em;
      white-space: nowrap;
    }
    .unit { color: var(--muted); font: 600 13px var(--font-sans, inherit); letter-spacing: 0; }
    .ticks { display: flex; align-items: flex-end; gap: 2px; height: var(--tally-height, 10px); margin-top: 10px; }
    .ticks i { flex: 1; height: 40%; border-radius: 1px; background: var(--tally-off, color-mix(in srgb, var(--muted) 40%, transparent)); transition: height .15s, background .15s; }
    .ticks i.on { height: 100%; background: var(--tally-on, var(--display-ink, #f4efe6)); }
    .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
    @media (prefers-reduced-motion: reduce) { .ticks i { transition: none; } }
  `,
  template: `
    <div class="fig" aria-hidden="true">{{ format(shown()) }}@if (unit()) {<span class="unit">{{ unit() }}</span>}</div>
    @if (max()) {
      <div class="ticks" aria-hidden="true">@for (t of tickList(); track $index) {<i [class.on]="$index < lit()"></i>}</div>
    }
    <span class="sr">{{ format(value()) }} {{ unit() }}</span>
  `,
})
export class KometaTally {
  readonly value = input(0);
  /** The value the ticks fill to; null draws no ticks. */
  readonly max = input<number | null>(null);
  readonly ticks = input(30);
  /** Words after the figure (`visits`, `of 60 visits`, `k so'm`). */
  readonly unit = input('');
  /** How long the count takes, in ms. */
  readonly duration = input(900);
  /** The locale for grouping digits (`ru-RU` writes 12 480); the browser's own when unset. */
  readonly locale = input<string | undefined>(undefined);

  protected readonly shown = signal(0);
  protected readonly tickList = computed(() => Array.from({ length: this.ticks() }));
  protected readonly lit = computed(() => {
    const max = this.max();
    return max ? Math.max(0, Math.min(this.ticks(), Math.round((this.shown() / max) * this.ticks()))) : 0;
  });

  private frame = 0;

  constructor() {
    const raf = typeof requestAnimationFrame === 'function';
    effect(() => {
      const to = this.value(), ms = this.duration();
      const from = untracked(this.shown);
      if (raf) cancelAnimationFrame(this.frame);
      const still = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!raf || still || ms <= 0 || from === to) { this.shown.set(to); return; }
      const t0 = performance.now();
      const step = (t: number) => {
        const k = Math.min(1, (t - t0) / ms);
        this.shown.set(Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3))));
        if (k < 1) this.frame = requestAnimationFrame(step);
      };
      this.frame = requestAnimationFrame(step);
    });
    inject(DestroyRef).onDestroy(() => raf && cancelAnimationFrame(this.frame));
  }

  protected format(n: number): string {
    return n.toLocaleString(this.locale());
  }
}
