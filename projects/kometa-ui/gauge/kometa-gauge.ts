import { ChangeDetectionStrategy, Component, computed, input, numberAttribute } from '@angular/core';
import { KometaInView } from 'kometa-ui/motion';

/**
 * A three-quarter ring that fills to `value / max`, with the percentage in its middle, or whatever you project there
 * instead (a figure, a face). It fills the first time it is on screen and glides when the value changes. It is an
 * image named by `label`, so say what it means: "7 of 9 slots booked".
 *
 * CSS custom properties: `--gauge-size` (84px), `--gauge-stroke` (9, in a 100-unit box), `--gauge-color` (`--amber`),
 * `--gauge-track` (`--input`), `--gauge-font-size` (18px, the percentage).
 *
 *     <k-gauge [value]="7" [max]="9" label="7 of 9 slots booked" />
 */
@Component({
  selector: 'k-gauge',
  hostDirectives: [KometaInView],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'img', '[attr.aria-label]': 'label()' },
  styles: `
    :host { position: relative; display: inline-grid; flex: none; width: var(--gauge-size, 84px); aspect-ratio: 1; vertical-align: middle; }
    svg { display: block; width: 100%; height: 100%; rotate: 135deg; overflow: visible; }
    circle { fill: none; stroke-width: var(--gauge-stroke, 9); stroke-linecap: round; }
    .track { stroke: var(--gauge-track, var(--input, var(--border))); stroke-dasharray: 75 100; }
    .fill { stroke: var(--gauge-color, var(--amber)); transition: stroke-dasharray .5s cubic-bezier(.22, 1, .36, 1); }
    .mid { position: absolute; inset: 0; display: grid; place-items: center; text-align: center; }
    .pct { font: 700 var(--gauge-font-size, 18px)/1 var(--font-display, 'Syne', sans-serif); letter-spacing: -.03em; font-variant-numeric: tabular-nums; }
    .pct small { margin-left: 1px; color: var(--muted); font-size: .55em; }
    @media (prefers-reduced-motion: no-preference) {
      /* !important: the final dash is an inline style. */
      :host(:not(.k-seen)) .fill { stroke-dasharray: 0 100 !important; }
      :host(.k-seen) .fill { animation: k-gauge-fill .9s .1s cubic-bezier(.2, .8, .2, 1) backwards; }
    }
    @media (prefers-reduced-motion: reduce) { .fill { transition: none; } }
    @keyframes k-gauge-fill { from { stroke-dasharray: 0 100; } }
  `,
  template: `
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <circle class="track" cx="50" cy="50" r="42" pathLength="100" />
      <circle class="fill" cx="50" cy="50" r="42" pathLength="100" [style.stroke-dasharray]="share() * 75 + ' 100'" />
    </svg>
    <div class="mid" aria-hidden="true"><ng-content><b class="pct">{{ pct() }}<small>%</small></b></ng-content></div>
  `,
})
export class KometaGauge {
  readonly value = input.required({ transform: numberAttribute });
  /** The value of a full ring. */
  readonly max = input(100, { transform: numberAttribute });
  /** What the ring means, read by a screen reader in place of it: "7 of 9 slots booked". */
  readonly label = input.required<string>();

  /** How full the ring is, 0 to 1; anything over `max` stays full. */
  protected readonly share = computed(() => {
    const max = this.max(), v = this.value();
    return max > 0 && Number.isFinite(v) ? Math.max(0, Math.min(1, v / max)) : 0;
  });
  protected readonly pct = computed(() => Math.round(this.share() * 100));
}
