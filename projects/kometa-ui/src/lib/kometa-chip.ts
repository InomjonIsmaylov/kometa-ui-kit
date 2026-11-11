import { ChangeDetectionStrategy, Component, booleanAttribute, input, model } from '@angular/core';

/**
 * A glass pill that is a multi-select toggle. Chosen: a 2px inset amber edge, never an amber fill.
 * Project the words (and an optional leading icon) as content, and a count as `<span chip-count>`.
 * The page owns the group: wrap several chips in `role="group"` with an aria-label.
 * Spec: kometa-chip.spec.ts.
 *
 *
 */
@Component({
  selector: 'k-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-selected]': "selected() ? '' : null" },
  styles: `
    :host { display: inline-flex; max-width: 100%; }
    button {
      margin: 0;
      padding: var(--chip-pad, 9px 14px);
      max-width: 100%;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border: 1px solid var(--glass-line, rgba(244, 239, 230, .14));
      border-radius: var(--chip-radius, var(--r-pill, 9999px));
      background: var(--glass, rgba(28, 26, 22, .82));
      box-shadow: inset 0 1px 0 var(--glass-hi, rgba(255, 255, 255, .1));
      color: var(--text);
      font: inherit;
      font-size: 14px;
      text-align: start;
      cursor: pointer;
      transition: box-shadow 420ms var(--ease-spring, cubic-bezier(0.22, 1.15, 0.36, 1)), border-color 200ms ease;
    }
    button:hover:not(:disabled) { border-color: var(--muted); }
    button[aria-pressed='true'] { box-shadow: inset 2px 0 0 var(--chip-accent, var(--amber)), inset 0 1px 0 var(--glass-hi, rgba(255, 255, 255, .1)); }
    button:focus-visible { outline: 2px solid var(--amber); outline-offset: 2px; }
    button:disabled { cursor: default; opacity: .5; }
    .count { color: var(--muted); font-variant-numeric: tabular-nums; }
    .count:empty { display: none; }
    @media (pointer: coarse) { button { min-height: 44px; } }
    @media (prefers-reduced-motion: reduce) { button { transition: none; } }
    @media (prefers-reduced-transparency: reduce) { button { background: var(--card); } }
  `,
  template: `
    <button type="button" [attr.aria-pressed]="selected() ? 'true' : 'false'" [disabled]="disabled()" [attr.aria-label]="ariaLabel() || null"
            (click)="selected.set(!selected())">
      <ng-content />
      <span class="count"><ng-content select="[chip-count]" /></span>
    </button>
  `,
})
export class KometaChip {
  readonly selected = model(false);
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Overrides the projected words as the accessible name. */
  readonly ariaLabel = input('');
}
