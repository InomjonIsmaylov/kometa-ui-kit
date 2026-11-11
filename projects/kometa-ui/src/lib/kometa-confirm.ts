import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * The row crossfades to the caller's question while `asking` is true. The question,
 * including Yo'q and Ha, is projected; this component draws no button of its own.
 * Spec: docs/superpowers/specs/2026-10-12-blend-shared-ui-design.md §4.
 *
 *
 */
@Component({
  selector: 'kometa-confirm',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: block; }
    .stack { display: grid; }
    .pane {
      grid-area: 1 / 1;
      transition: opacity 200ms ease;
    }
    .pane.off {
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
    }
    @media (prefers-reduced-motion: reduce) {
      .pane { transition: none; }
    }
  `,
  template: `
    <div class="stack">
      <div class="pane" [class.off]="asking()">
        <ng-content select="[data-row]" />
      </div>
      <div class="pane" [class.off]="!asking()">
        <ng-content select="[data-question]" />
      </div>
    </div>
  `,
})
export class KometaConfirm {
  readonly asking = input(false);
}
