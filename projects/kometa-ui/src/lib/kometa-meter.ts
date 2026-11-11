import { ChangeDetectionStrategy, Component, computed, effect, input, signal } from '@angular/core';

/**
 * A Syne figure "17 / 25" over one tick per unit: a spent tick is dim and short, a remaining one bright
 * and tall. Above 40 units it draws 25 ticks and scales; the figure stays exact. Read-only.
 * Spec: docs/superpowers/specs/2026-10-12-blend-shared-ui-design.md §4; tests in kometa-meter.spec.ts.
 *
 *
 */
@Component({
  selector: 'kometa-meter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: block; }
    .fig {
      margin: 0 0 8px;
      color: var(--display-ink, #f4efe6);
      font-family: var(--font-display, 'Syne', sans-serif);
      font-size: 32px;
      font-weight: 700;
      letter-spacing: -0.03em;
      font-variant-numeric: tabular-nums;
    }
    .fig b { display: inline-block; font-weight: 700; }
    .rolled .fig b { animation: roll .42s var(--ease-spring, ease); }
    .fig span { color: var(--muted); font-size: 18px; }
    .ticks { display: flex; gap: 3px; height: 28px; }
    .ticks i {
      flex: 1;
      border-radius: 2px;
      background: var(--glass-line);
      transform: scaleY(.45);
      transform-origin: bottom;
      transition: background .42s ease, transform .42s var(--ease-spring, ease);
    }
    .ticks i.on { background: var(--display-ink, #f4efe6); transform: none; }
    .note { margin: 8px 0 0; color: var(--muted); font-size: 12px; }
    @keyframes roll { from { transform: translateY(-12px); opacity: .3; } }
    @media (prefers-reduced-motion: reduce) {
      .rolled .fig b { animation: none; }
      .ticks i { transition: none; }
    }
  `,
  template: `
    <div role="meter" [class.rolled]="rolled()" [attr.aria-label]="ariaLabel() || label() || null"
         aria-valuemin="0" [attr.aria-valuemax]="max()" [attr.aria-valuenow]="clamped()"
         [attr.aria-valuetext]="text()">
      <p class="fig">
        @for (v of [clamped()]; track v) {
          <b>{{ v }}</b>
        }<span> / {{ max() }}</span>
      </p>
      <div class="ticks" aria-hidden="true">
        @for (t of ticks(); track $index) {
          <i [class.on]="t"></i>
        }
      </div>
      @if (label()) {
        <p class="note">{{ label() }}</p>
      }
    </div>
  `,
})
export class KometaMeter {
  readonly value = input(0);
  readonly max = input(25);
  /** The muted line under the ticks, e.g. "bepul lid qoldi". */
  readonly label = input('');
  readonly ariaLabel = input('');

  /** True from the first change on, so mounting never rolls the figure. */
  protected readonly rolled = signal(false);
  private first = true;
  protected readonly clamped = computed(() => Math.min(this.max(), Math.max(0, this.value())));
  protected readonly text = computed(() => `${this.clamped()} / ${this.max()}${this.label() ? ' ' + this.label() : ''}`);
  /** One flag per tick, true while it is still bright. */
  protected readonly ticks = computed(() => {
    const max = Math.max(0, Math.floor(this.max()));
    const count = max > 40 ? 25 : max;
    const bright = max > 40 ? Math.round((this.clamped() / max) * count) : Math.round(this.clamped());
    return Array.from({ length: count }, (_, i) => i < bright);
  });

  constructor() {
    effect(() => {
      this.clamped();
      if (this.first) this.first = false;
      else this.rolled.set(true);
    });
  }
}
