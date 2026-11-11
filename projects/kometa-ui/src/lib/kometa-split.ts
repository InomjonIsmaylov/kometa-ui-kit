import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** One side of a cash/card pair. `amount` is already formatted by the caller. */
export interface KometaSplitSide {
  amount: string;
  label: string;
}

/**
 * Two Syne figures side by side. Spec: docs/superpowers/specs/2026-10-12-blend-shared-ui-design.md §4.
 *
 *
 */
@Component({
  selector: 'kometa-split',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-align]': 'align()' },
  styles: `
    :host { display: grid; grid-template-columns: 1fr 1fr; gap: var(--split-gap, 16px); }
    :host([data-align='center']) { text-align: center; }
    .amount {
      display: block;
      font-family: var(--font-display, 'Syne'), sans-serif;
      font-weight: 700;
      font-size: var(--split-amount-size, 28px);
      font-variant-numeric: tabular-nums;
      letter-spacing: -0.03em;
    }
    .label { display: block; color: var(--muted); font-size: 13px; }
  `,
  template: `
    <div>
      <span class="amount">{{ left().amount }}</span>
      <span class="label">{{ left().label }}</span>
    </div>
    <div>
      <span class="amount">{{ right().amount }}</span>
      <span class="label">{{ right().label }}</span>
    </div>
  `,
})
export class KometaSplit {
  readonly left = input.required<KometaSplitSide>();
  readonly right = input.required<KometaSplitSide>();
  readonly align = input<'start' | 'center'>('start');
}
