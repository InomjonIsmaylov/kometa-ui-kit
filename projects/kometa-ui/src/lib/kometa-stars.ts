import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

const STAR = 'M12 2.6l2.7 6.1 6.6.6-5 4.4 1.5 6.5L12 16.9 6.2 20.2 7.7 13.7 2.7 9.3l6.6-.6L12 2.6z';

/**
 * Five inline stars. Filled up to the floor of `value` (clamped 0–5); the rest are outlines.
 * `label` is the accessible name, so the dictionary owns the words.
 * Spec: docs/superpowers/specs/2026-10-12-blend-shared-ui-design.md §4.
 *
 *
 */
@Component({
  selector: 'kometa-stars',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'img',
    '[attr.aria-label]': 'label()',
    '[style.--stars-size.px]': 'size()',
  },
  styles: `
    :host { display: inline-flex; gap: 2px; color: var(--amber); }
    svg { width: var(--stars-size, 16px); height: var(--stars-size, 16px); display: block; }
  `,
  template: `
    @for (star of stars(); track star.index) {
      <svg viewBox="0 0 24 24" aria-hidden="true" [attr.data-fill]="star.filled ? 'filled' : 'outline'">
        <path
          [attr.d]="path"
          [attr.fill]="star.filled ? 'currentColor' : 'none'"
          [attr.stroke]="star.filled ? 'none' : 'currentColor'"
          stroke-width="1.6"
          stroke-linejoin="round"
        />
      </svg>
    }
  `,
})
export class KometaStars {
  readonly value = input(0);
  readonly label = input.required<string>();
  /** How many stars (default 5). */
  readonly max = input(5);
  /** Star size in pixels; null keeps the CSS (`--stars-size`, 16px). */
  readonly size = input<number | null>(null);

  protected readonly path = STAR;
  protected readonly stars = computed(() => {
    const raw = this.value();
    const max = Math.max(1, Math.floor(this.max()));
    const clamped = Number.isFinite(raw) ? Math.min(max, Math.max(0, raw)) : 0;
    const filled = Math.floor(clamped);
    return Array.from({ length: max }, (_, i) => i).map((index) => ({ index, filled: index < filled }));
  });
}
