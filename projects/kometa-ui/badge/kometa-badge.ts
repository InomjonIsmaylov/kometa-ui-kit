import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input } from '@angular/core';

/**
 * A count on the corner of whatever it wraps (an icon, an avatar, a button): a cream disc with the figure in mono,
 * cut out of the background by a ring, that pops each time the count changes. Over `max` it shows `99+`; at zero
 * it is gone unless `showZero`. The disc is hidden from a screen reader, which hears `label` (`{n}` is the count)
 * instead, so put the badge inside the control it describes.
 *
 *     <button aria-label="Notifications"><k-badge [count]="3"><i class="ti ti-bell"></i></k-badge></button>
 *
 * Tests in kometa-badge.spec.ts.
 */
@Component({
  selector: 'k-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { position: relative; display: inline-flex; vertical-align: middle; }
    .disc {
      position: absolute;
      top: var(--badge-top, -5px);
      right: var(--badge-right, -7px);
      min-width: var(--badge-size, 17px);
      height: var(--badge-size, 17px);
      padding: 0 4px;
      box-sizing: border-box;
      border-radius: 999px;
      background: var(--badge-bg, var(--display-ink, #f4efe6));
      color: var(--badge-ink, var(--bg));
      box-shadow: 0 0 0 2px var(--badge-ring, var(--bg));
      font: 500 10px/var(--badge-size, 17px) var(--font-mono, monospace);
      font-variant-numeric: tabular-nums;
      text-align: center;
      pointer-events: none;
      animation: k-badge-pop .45s cubic-bezier(.22, 1.6, .36, 1);
    }
    @keyframes k-badge-pop { from { transform: scale(.4); } }
    .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
    @media (prefers-reduced-motion: reduce) { .disc { animation: none; } }
  `,
  template: `
    <ng-content />
    @if (shown()) {
      <!-- One pass per count, so the pop replays on every change. -->
      @for (t of [text()]; track t) {
        <span class="disc" aria-hidden="true">{{ t }}</span>
      }
      @if (label()) {<span class="sr">{{ label().replace('{n}', '' + count()) }}</span>}
    }
  `,
})
export class KometaBadge {
  readonly count = input(0);
  /** Above this the disc reads `max+`. */
  readonly max = input(99);
  readonly showZero = input(false, { transform: booleanAttribute });
  /** What a screen reader hears; `{n}` is the count. Empty leaves it to the wrapped control's own label. */
  readonly label = input('{n} new');

  protected readonly shown = computed(() => this.count() > 0 || this.showZero());
  protected readonly text = computed(() => (this.count() > this.max() ? `${this.max()}+` : `${this.count()}`));
}
