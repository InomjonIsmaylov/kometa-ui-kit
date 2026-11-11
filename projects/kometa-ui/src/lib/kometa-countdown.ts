import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, output, signal } from '@angular/core';

/**
 * Time running out: a Syne figure "0:42" and a row of ticks that drain one by one, right to left, the way
 * `k-meter` spends a count. `duration` (seconds) is the span the ticks stand for; the end is `until`, or
 * `duration` from when it was drawn. Emits `done` once at zero. Above 40 seconds it draws 30 ticks.
 * Tests in kometa-countdown.spec.ts.
 */
@Component({
  selector: 'k-countdown',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: block; }
    .fig {
      margin: 0 0 8px;
      color: var(--display-ink, #f4efe6);
      font-family: var(--font-display, 'Syne', sans-serif);
      font-size: var(--countdown-figure-size, 22px);
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      line-height: 1.15;
    }
    .fig span { color: var(--muted); font-size: 13px; margin-left: .4em; }
    .ticks { display: flex; align-items: flex-end; gap: 2px; height: var(--countdown-height, 22px); }
    .ticks i {
      flex: 1;
      height: 100%;
      border-radius: 1px;
      background: var(--countdown-on, var(--display-ink, #f4efe6));
      transform-origin: bottom;
      transition: background .4s ease, transform .4s var(--ease-spring, ease);
    }
    .ticks i.off { background: var(--countdown-off, var(--glass-line)); transform: scaleY(.35); }
    @media (prefers-reduced-motion: reduce) { .ticks i { transition: none; } }
  `,
  template: `
    <p class="fig" role="timer" [attr.aria-label]="ariaLabel() || null">{{ figure() }}@if (label()) {<span>{{ label() }}</span>}</p>
    <div class="ticks" aria-hidden="true">
      @for (t of ticks(); track $index) {
        <i [class.off]="!t"></i>
      }
    </div>
  `,
})
export class KometaCountdown {
  /** Seconds the full row of ticks stands for. */
  readonly duration = input(60);
  /** When it ends. Without it, it ends `duration` seconds after it is drawn. */
  readonly until = input<Date | number | string | null>(null);
  /** The muted words after the figure, e.g. "to confirm". */
  readonly label = input('');
  readonly ariaLabel = input('');
  readonly done = output<void>();

  private readonly started = Date.now();
  private readonly now = signal(this.started);
  private readonly end = computed(() => {
    const u = this.until();
    return u == null ? this.started + this.duration() * 1000 : new Date(u).getTime();
  });
  protected readonly left = computed(() => Math.max(0, Math.ceil((this.end() - this.now()) / 1000)));
  protected readonly figure = computed(() => {
    const s = this.left();
    const pad = (n: number) => String(n).padStart(2, '0');
    return s >= 3600 ? `${Math.floor(s / 3600)}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}` : `${Math.floor(s / 60)}:${pad(s % 60)}`;
  });
  /** One flag per tick, true while it still stands. */
  protected readonly ticks = computed(() => {
    const span = Math.max(1, this.duration());
    const count = span > 40 ? 30 : span;
    const standing = Math.ceil((Math.min(this.left(), span) / span) * count);
    return Array.from({ length: count }, (_, i) => i < standing);
  });

  constructor() {
    const timer = setInterval(() => this.now.set(Date.now()), 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
    let fired = false;
    effect(() => {
      if (this.left() > 0) fired = false;
      else if (!fired) {
        fired = true;
        this.done.emit();
      }
    });
  }
}
