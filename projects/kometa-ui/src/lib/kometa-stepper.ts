import { ChangeDetectionStrategy, Component, computed, input, model, output, signal } from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';

/**
 * A number between two hairline circles (minus, plus). The figure rolls when it changes and a circle
 * dims at its limit. Words (unit, button labels) come from the caller.
 * Spec: docs/superpowers/specs/2026-10-12-blend-shared-ui-design.md §4; tests in kometa-stepper.spec.ts.
 *
 *
 */
@Component({
  selector: 'k-stepper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: inline-block; }
    .ring { display: flex; align-items: center; gap: var(--stepper-gap, 14px); }
    button {
      width: var(--stepper-size, 36px);
      height: var(--stepper-size, 36px);
      flex: none;
      padding: 0;
      border-radius: 50%;
      border: 1px solid var(--stepper-line, var(--glass-line));
      background: transparent;
      color: var(--display-ink, #f4efe6);
      font-size: var(--stepper-icon-size, 18px);
      line-height: 1;
      cursor: pointer;
      transition: opacity .42s ease;
    }
    button:disabled { opacity: .3; cursor: default; }
    button:focus-visible, .fig:focus-visible { outline: 2px solid var(--amber); outline-offset: 2px; }
    @media (pointer: coarse) { button { width: 44px; height: 44px; } }
    .fig {
      margin: 0;
      min-width: var(--stepper-fig-width, 84px);
      text-align: center;
      color: var(--display-ink, #f4efe6);
      font-family: var(--font-display, 'Syne', sans-serif);
      font-size: var(--stepper-fig-size, 28px);
      font-weight: 700;
      letter-spacing: -0.03em;
      font-variant-numeric: tabular-nums;
    }
    .fig b { display: inline-block; font-weight: 700; }
    .fig b.up { animation: roll-up .42s var(--ease-spring, ease); }
    .fig b.down { animation: roll-down .42s var(--ease-spring, ease); }
    .unit { color: var(--muted); font-size: 14px; font-weight: 500; letter-spacing: 0; }
    @keyframes roll-up { from { transform: translateY(14px); opacity: .3; } }
    @keyframes roll-down { from { transform: translateY(-14px); opacity: .3; } }
    @media (prefers-reduced-motion: reduce) {
      button { transition: none; }
      .fig b.up, .fig b.down { animation: none; }
    }
  `,
  template: `
    <div class="ring">
      <button type="button" [attr.aria-label]="decrementLabel() || null"
              [disabled]="disabled() || readonly() || value() <= lo()" (blur)="touch.emit()" (click)="bump(-1)">{{ decrementIcon() }}</button>
      <p class="fig" role="spinbutton" [attr.tabindex]="disabled() ? -1 : 0"
         [attr.aria-label]="ariaLabel() || null"
         [attr.aria-valuenow]="value()" [attr.aria-valuemin]="lo()" [attr.aria-valuemax]="maxAttr()"
         [attr.aria-valuetext]="unit() ? value() + ' ' + unit() : null"
         [attr.aria-disabled]="disabled() ? 'true' : null" [attr.aria-readonly]="readonly() ? 'true' : null"
         (blur)="touch.emit()" (keydown)="onKeydown($event)">
        @for (v of [value()]; track v) {
          <b [class.up]="roll() > 0" [class.down]="roll() < 0">{{ v }}</b>
        }
        @if (unit()) {
          <span class="unit"> {{ unit() }}</span>
        }
      </p>
      <button type="button" [attr.aria-label]="incrementLabel() || null"
              [disabled]="disabled() || readonly() || value() >= hi()" (blur)="touch.emit()" (click)="bump(1)">{{ incrementIcon() }}</button>
    </div>
  `,
})
export class KometaStepper implements FormValueControl<number> {
  readonly value = model(0);
  /** `undefined` (what `[formField]` binds with no validator) falls back to 0 and no upper limit. */
  readonly min = input<number | undefined>(0);
  readonly max = input<number | undefined>(undefined);
  readonly step = input(1);
  /** Muted word after the figure, e.g. "daq". */
  readonly unit = input('');
  readonly ariaLabel = input('');
  readonly decrementLabel = input('');
  readonly incrementLabel = input('');
  readonly disabled = input(false);
  /** Keeps the figure focusable and announced but stops every change. */
  readonly readonly = input(false);
  /** The glyphs inside the two circles. */
  readonly decrementIcon = input('−');
  readonly incrementIcon = input('+');
  readonly touched = input(false);
  /** Emitted when focus leaves a circle or the figure, which is what marks a Signal Forms field touched. */
  readonly touch = output<void>();

  /** -1, 0 or 1: which way the last change went. 0 until the first change, so mounting never rolls. */
  protected readonly roll = signal(0);
  protected readonly lo = computed(() => this.min() ?? 0);
  protected readonly hi = computed(() => this.max() ?? Number.POSITIVE_INFINITY);
  protected readonly maxAttr = computed(() => (Number.isFinite(this.hi()) ? this.hi() : null));

  protected bump(times: number): void {
    this.set(this.value() + times * this.step());
  }

  private set(next: number): void {
    const n = Math.round(Math.min(this.hi(), Math.max(this.lo(), next)) * 1e9) / 1e9;
    if (n === this.value()) return;
    this.roll.set(n > this.value() ? 1 : -1);
    this.value.set(n);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (this.disabled() || this.readonly()) return;
    const big = this.step() * 10;
    const next: Record<string, number | undefined> = {
      ArrowUp: this.value() + this.step(),
      ArrowDown: this.value() - this.step(),
      PageUp: this.value() + big,
      PageDown: this.value() - big,
      Home: this.lo(),
      End: Number.isFinite(this.hi()) ? this.hi() : undefined,
    };
    const to = next[event.key];
    if (to === undefined) return;
    event.preventDefault();
    this.set(to);
  }
}
