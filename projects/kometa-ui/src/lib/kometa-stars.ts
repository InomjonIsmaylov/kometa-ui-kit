import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

const STAR = 'M12 2.6l2.7 6.1 6.6.6-5 4.4 1.5 6.5L12 16.9 6.2 20.2 7.7 13.7 2.7 9.3l6.6-.6L12 2.6z';

/**
 * Five inline stars. `value` (clamped 0–max) rounds to the nearest half: whole stars filled, a half star filled on its left, the rest outlines.
 * `label` is the accessible name, so the dictionary owns the words.
 * Spec: docs/superpowers/specs/2026-10-12-blend-shared-ui-design.md §4.
 *
 *
 */
@Component({
  selector: 'k-stars',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'img',
    '[attr.aria-label]': 'label()',
    '[style.--stars-size.px]': 'size()',
  },
  styles: `
    :host { display: inline-flex; gap: 2px; color: var(--amber); }
    svg { width: var(--stars-size, 16px); height: var(--stars-size, 16px); display: block; }
    .half { clip-path: inset(0 50% 0 0); }
    :host-context([dir='rtl']) .half { clip-path: inset(0 0 0 50%); }
  `,
  template: `
    @for (star of stars(); track star.index) {
      <svg viewBox="0 0 24 24" aria-hidden="true" [attr.data-fill]="star.fill">
        @if (star.fill !== 'filled') {
          <path [attr.d]="path" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
        }
        @if (star.fill !== 'outline') {
          <path [attr.d]="path" fill="currentColor" [class.half]="star.fill === 'half'" />
        }
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
    const halves = Math.round(clamped * 2);
    return Array.from({ length: max }, (_, index) => ({
      index,
      fill: index * 2 + 2 <= halves ? 'filled' : index * 2 + 1 === halves ? 'half' : 'outline',
    }));
  });
}
