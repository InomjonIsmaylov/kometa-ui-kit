import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** One day on a read-only week. A null `mark` is a closed day. */
export interface KometaMarkDay {
  label: string;
  mark: string | null;
}

/**
 * A week of marks. A null mark is a muted day with a dash under the label.
 * Spec: docs/superpowers/specs/2026-10-12-blend-shared-ui-design.md §4.
 *
 *
 */
@Component({
  selector: 'kometa-marks',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: flex; gap: var(--marks-gap, 12px); }
    .day { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .label { font-size: var(--marks-label-size, 13px); }
    .mark { font-variant-numeric: tabular-nums; white-space: pre-line; }
    .day.muted { color: var(--marks-muted, var(--muted)); }
  `,
  template: `
    @for (day of days(); track $index) {
      <div class="day" [class.muted]="day.mark === null">
        <span class="label">{{ day.label }}</span>
        <span class="mark">{{ day.mark === null ? empty() : day.mark }}</span>
      </div>
    }
  `,
})
export class KometaMarks {
  readonly days = input.required<KometaMarkDay[]>();
  /** What a closed day shows in place of a mark. */
  readonly empty = input('—');
}
