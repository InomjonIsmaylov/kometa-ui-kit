import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input, model, signal } from '@angular/core';

/** `#RRGGBB` for a hue (0–360) at a saturation and lightness in percent. */
export function hslToHex(h: number, s: number, l: number): string {
  const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = l / 100 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(c * 255).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

/** The hue (0–360) of a `#RRGGBB` colour; a grey is 0. */
export function hexToHue(hex: string): number {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim());
  if (!m) return 0;
  const [r, g, b] = m.slice(1).map((x) => parseInt(x, 16) / 255);
  const max = Math.max(r, g, b), d = max - Math.min(r, g, b);
  if (!d) return 0;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}

/**
 * A colour picked from a row of hue ticks: every tick is drawn in its own hue and the chosen one stands tall.
 * A disc of the colour and its hex in mono sit underneath. Saturation and lightness are fixed by the caller,
 * so every pick sits in one family. The tick row is a `role="slider"` (arrows, Home, End) and can be dragged.
 * `value` is `#RRGGBB`. Tests in kometa-hue.spec.ts.
 */
@Component({
  selector: 'k-hue',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: block; }
    .ticks { display: flex; align-items: flex-end; gap: 2px; height: var(--hue-height, 26px); cursor: pointer; touch-action: none; border-radius: 4px; }
    .ticks i {
      flex: 1;
      height: 100%;
      border-radius: 1px;
      transform: scaleY(.45);
      transform-origin: bottom;
      transition: transform .3s var(--ease-spring, ease);
    }
    .ticks i.on { transform: none; }
    .ticks:focus-visible { outline: 2px solid var(--amber); outline-offset: 4px; }
    :host(.disabled) .ticks { cursor: default; opacity: .5; }
    .out { display: flex; align-items: center; gap: 8px; margin-top: 10px; }
    .disc { width: 18px; height: 18px; border-radius: 50%; box-shadow: 0 0 0 1px var(--glass-line); }
    .hex { color: var(--text2); font-family: var(--font-mono); font-size: 12px; }
    @media (pointer: coarse) { .ticks { min-height: 44px; } }
    @media (prefers-reduced-motion: reduce) { .ticks i { transition: none; } }
  `,
  template: `
    <div class="ticks" role="slider" [attr.tabindex]="disabled() ? -1 : 0" [attr.aria-disabled]="disabled() || null"
         [attr.aria-label]="ariaLabel() || null" aria-valuemin="0" [attr.aria-valuemax]="count() - 1" [attr.aria-valuenow]="at()"
         [attr.aria-valuetext]="value()" (keydown)="key($event)" (pointerdown)="down($event)" (pointermove)="move($event)"
         (pointerup)="dragging.set(false)" (pointercancel)="dragging.set(false)">
      @for (c of colours(); track $index) {
        <i [class.on]="$index === at()" [style.background]="c"></i>
      }
    </div>
    @if (showValue()) {
      <div class="out" aria-hidden="true"><span class="disc" [style.background]="value()"></span><span class="hex">{{ value() }}</span></div>
    }
  `,
  host: { '[class.disabled]': 'disabled()' },
})
export class KometaHue {
  readonly value = model('#E7C255');
  /** How many hues the row offers. */
  readonly count = input(24);
  readonly saturation = input(75);
  readonly lightness = input(62);
  readonly disabled = input(false, { transform: booleanAttribute });
  /** False hides the disc and hex under the ticks. */
  readonly showValue = input(true, { transform: booleanAttribute });
  readonly ariaLabel = input('');

  protected readonly dragging = signal(false);
  protected readonly colours = computed(() =>
    Array.from({ length: this.count() }, (_, i) => hslToHex((i * 360) / this.count(), this.saturation(), this.lightness())));
  /** The tick nearest the value's hue. */
  protected readonly at = computed(() => Math.round((hexToHue(this.value()) / 360) * this.count()) % this.count());

  private pick(i: number): void {
    this.value.set(this.colours()[Math.min(this.count() - 1, Math.max(0, i))]);
  }

  protected key(e: KeyboardEvent): void {
    if (this.disabled()) return;
    const by: Record<string, number> = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 };
    if (e.key in by) this.pick(this.at() + by[e.key]);
    else if (e.key === 'Home') this.pick(0);
    else if (e.key === 'End') this.pick(this.count() - 1);
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
    if (r.width) this.pick(Math.floor(((e.clientX - r.left) / r.width) * this.count()));
  }
}
