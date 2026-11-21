import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input } from '@angular/core';
import { KometaInView } from 'kometa-ui/motion';
import { areaPath, linePath, spread } from 'kometa-ui/scale';

/**
 * A small trend line with a soft fill and a dot on the latest value, drawn from a zero baseline; it wipes in from the
 * left the first time it is on screen. It fills the width it is given. With a `label` it is an image a screen reader
 * names; without one it is decoration beside a figure that already says it.
 *
 * CSS custom properties: `--spark-height` (34px), `--spark-color` (`--amber`, also the `color` input),
 * `--spark-fill-opacity` (.12), `--spark-dot-ring` (the ring round the dot, `--card`).
 *
 *     <k-spark [values]="[3, 5, 4, 8, 7, 11]" label="Visits per day this week, from 3 to 11" />
 */
@Component({
  selector: 'k-spark',
  hostDirectives: [KometaInView],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.role]': 'label() ? "img" : null',
    '[attr.aria-label]': 'label() || null',
    '[attr.aria-hidden]': '!label() || null',
    '[style.--spark-color]': 'color() || null',
  },
  styles: `
    :host { position: relative; display: block; min-width: 0; height: var(--spark-height, 34px); color: var(--spark-color, var(--amber)); }
    svg { display: block; width: 100%; height: 100%; overflow: visible; }
    .area { fill: currentColor; opacity: var(--spark-fill-opacity, .12); }
    .line { fill: none; stroke: currentColor; stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }
    .dot {
      position: absolute; right: -3px; width: 6px; height: 6px; margin-bottom: -3px; border-radius: 50%;
      background: currentColor; box-shadow: 0 0 0 2px var(--spark-dot-ring, var(--card)), 0 0 10px currentColor;
    }
    @media (prefers-reduced-motion: no-preference) {
      :host(:not(.k-seen)) svg { clip-path: inset(0 100% 0 0); }
      :host(:not(.k-seen)) .dot { opacity: 0; }
      :host(.k-seen) svg { animation: k-spark-wipe .9s .15s cubic-bezier(.3, .7, .2, 1) both; }
      :host(.k-seen) .dot { animation: k-spark-pop .3s .95s cubic-bezier(.3, 1.6, .5, 1) both; }
    }
    @keyframes k-spark-wipe { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0 0 0 0); } }
    @keyframes k-spark-pop { from { opacity: 0; transform: scale(0); } }
  `,
  template: `
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true">
      @if (fill()) { <path class="area" [attr.d]="area()" /> }
      <path class="line" [attr.d]="line()" vector-effect="non-scaling-stroke" />
    </svg>
    @if (dot() && last() !== null) { <i class="dot" [style.bottom.%]="last()"></i> }
  `,
})
export class KometaSpark {
  readonly values = input.required<readonly number[]>();
  /** A sentence for a screen reader ("Visits per day, from 3 to 11"); empty hides the line from it. */
  readonly label = input('');
  /** The line colour, in place of `--spark-color`. */
  readonly color = input('');
  /** False draws the line alone, with no fill under it. */
  readonly fill = input(true, { transform: booleanAttribute });
  /** False leaves out the dot on the latest value. */
  readonly dot = input(true, { transform: booleanAttribute });

  private readonly finite = computed(() => this.values().map((v) => (Number.isFinite(v) ? v : 0)));
  // 2 units of air top and bottom so the stroke is not cut at the extremes.
  private readonly pts = computed(() => {
    const v = this.finite();
    const top = Math.max(0, ...v);
    return spread(v, 100, 28, Math.min(0, ...v), top > 0 ? top : 1).map(([x, y]) => [x, y + 2] as const);
  });
  protected readonly line = computed(() => linePath(this.pts()));
  protected readonly area = computed(() => areaPath(this.pts(), 32));
  /** The latest point's height, in percent from the bottom; null with no values. */
  protected readonly last = computed(() => {
    const p = this.pts().at(-1);
    return p ? 100 - (p[1] / 32) * 100 : null;
  });
}
