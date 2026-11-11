import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

/**
 * A Syne title and a hairline that runs out to the action, which is any element with an `action`
 * attribute projected into it. With no action the hairline runs out to the edge.
 * Spec: docs/superpowers/specs/2026-10-12-blend-shared-ui-design.md, "Heading: rule".
 */
@Component({
  selector: 'k-heading',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: flex; align-items: center; gap: var(--heading-gap, 12px); }
    .t {
      margin: 0;
      color: var(--heading-color, var(--text, inherit));
      font-family: var(--font-display, 'Syne', sans-serif);
      font-size: var(--heading-size, 22px);
      font-weight: 700;
      letter-spacing: -0.03em;
    }
    .rule { flex: 1; min-width: 12px; height: 1px; background: var(--heading-rule-color, var(--glass-line, rgba(244, 239, 230, .18))); }
  `,
  template: `
    @switch (level()) {
      @case (3) { <h3 class="t" [attr.id]="headingId() || null">{{ title() }}</h3> }
      @case (4) { <h4 class="t" [attr.id]="headingId() || null">{{ title() }}</h4> }
      @default { <h2 class="t" [attr.id]="headingId() || null">{{ title() }}</h2> }
    }
    @if (rule()) { <i class="rule" aria-hidden="true"></i> }
    <ng-content select="[action]" />
  `,
})
export class KometaHeading {
  readonly title = input.required<string>();
  readonly level = input<2 | 3 | 4>(2);
  /** The id put on the heading element so a region can name itself with `aria-labelledby`. */
  readonly headingId = input('');
  /** False draws no hairline, so the action sits next to the title. */
  readonly rule = input(true, { transform: booleanAttribute });
}
