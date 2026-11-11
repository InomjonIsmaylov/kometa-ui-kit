import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input, model, signal } from '@angular/core';

/**
 * A value chosen by dragging along a row of ticks: the ticks up to the value stand tall and cream, the rest
 * lie short and dim, the way `k-meter` draws a count. A Syne figure "12 / 20 km" sits above. The tick row
 * is the `role="slider"`: arrows step, PageUp/PageDown move a tenth, Home/End jump to the ends.
 * Above 40 steps it draws 25 ticks and scales; the figure stays exact.
 * A Signal Forms control (`value` model plus `disabled` input). Tests in kometa-slider.spec.ts.
 */
@Component({
  selector: 'k-slider',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: block; }
    .fig {
      margin: 0 0 8px;
      color: var(--display-ink, #f4efe6);
      font-family: var(--font-display, 'Syne', sans-serif);
      font-size: var(--slider-figure-size, 22px);
      font-weight: 700;
      letter-spacing: -0.02em;
      line-height: 1.15;
      font-variant-numeric: tabular-nums;
    }
    .fig span { color: var(--muted); font-size: .64em; }
    .ticks {
      display: flex;
      align-items: flex-end;
      gap: 3px;
      height: var(--slider-height, 26px);
      cursor: ew-resize;
      touch-action: none;
      border-radius: 4px;
    }
    .ticks i {
      flex: 1;
      height: 100%;
      border-radius: 2px;
      background: var(--slider-off, var(--glass-line));
      transform: scaleY(.4);
      transform-origin: bottom;
      transition: background .25s ease, transform .25s var(--ease-spring, ease);
    }
    .ticks i.on { background: var(--slider-on, var(--display-ink, #f4efe6)); transform: none; }
    .ticks:focus-visible { outline: 2px solid var(--amber); outline-offset: 4px; }
    :host(.disabled) .ticks { cursor: default; opacity: .5; }
    @media (pointer: coarse) { .ticks { min-height: 44px; } }
    @media (prefers-reduced-motion: reduce) { .ticks i { transition: none; } }
  `,
  template: `
    @if (showFigure()) {
      <p class="fig" aria-hidden="true">{{ value() }}<span> / {{ max() }}{{ unit() ? ' ' + unit() : '' }}</span></p>
    }
    <div class="ticks" role="slider" [attr.tabindex]="disabled() ? -1 : 0" [attr.aria-disabled]="disabled() || null"
         [attr.aria-label]="ariaLabel() || null" [attr.aria-labelledby]="ariaLabelledBy() || null"
         [attr.aria-valuemin]="min()" [attr.aria-valuemax]="max()" [attr.aria-valuenow]="value()" [attr.aria-valuetext]="text()"
         (keydown)="key($event)" (pointerdown)="down($event)" (pointermove)="move($event)" (pointerup)="dragging.set(false)"
         (pointercancel)="dragging.set(false)">
      @for (t of ticks(); track $index) {
        <i [class.on]="t"></i>
      }
    </div>
  `,
  host: { '[class.disabled]': 'disabled()' },
})
export class KometaSlider {
  readonly value = model(0);
  readonly min = input(0);
  readonly max = input(20);
  readonly step = input(1);
  /** The unit after the figure, e.g. "km". */
  readonly unit = input('');
  readonly disabled = input(false, { transform: booleanAttribute });
  /** False hides the figure and leaves the ticks (the value is still read aloud). */
  readonly showFigure = input(true, { transform: booleanAttribute });
  readonly ariaLabel = input('');
  readonly ariaLabelledBy = input('');

  protected readonly dragging = signal(false);
  protected readonly text = computed(() => `${this.value()} / ${this.max()}${this.unit() ? ' ' + this.unit() : ''}`);
  /** One flag per tick, true while it stands. */
  protected readonly ticks = computed(() => {
    const steps = Math.max(1, Math.round((this.max() - this.min()) / this.step()));
    const count = steps > 40 ? 25 : steps;
    const lit = Math.round(((this.value() - this.min()) / (this.max() - this.min() || 1)) * count);
    return Array.from({ length: count }, (_, i) => i < lit);
  });

  /** Clamps into range and snaps to a whole step; rounding keeps 0.1 steps free of float noise. */
  private set(v: number): void {
    const { min, max, step } = { min: this.min(), max: this.max(), step: this.step() };
    const snapped = Math.round((min + Math.round((v - min) / step) * step) * 1e6) / 1e6;
    this.value.set(Math.min(max, Math.max(min, snapped)));
  }

  protected key(e: KeyboardEvent): void {
    if (this.disabled()) return;
    const big = Math.max(this.step(), (this.max() - this.min()) / 10);
    const moves: Record<string, number> = {
      ArrowRight: this.step(), ArrowUp: this.step(), ArrowLeft: -this.step(), ArrowDown: -this.step(), PageUp: big, PageDown: -big,
    };
    if (e.key in moves) this.set(this.value() + moves[e.key]);
    else if (e.key === 'Home') this.set(this.min());
    else if (e.key === 'End') this.set(this.max());
    else return;
    e.preventDefault();
  }

  protected down(e: PointerEvent): void {
    if (this.disabled()) return;
    this.dragging.set(true);
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    this.move(e);
  }

  protected move(e: PointerEvent): void {
    if (!this.dragging()) return;
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (!r.width) return;
    const p = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    this.set(this.min() + p * (this.max() - this.min()));
  }
}
