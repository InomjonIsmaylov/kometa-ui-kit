import {
  ChangeDetectionStrategy, Component, DOCUMENT, ElementRef, Injector, afterNextRender, booleanAttribute, effect, inject, input, viewChildren,
} from '@angular/core';

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * The row crossfades to the caller's question while `asking` is true. The question,
 * including Yo'q and Ha, is projected; this component draws no button of its own. When focus was inside the
 * component as the panes swap, it moves to the first focusable element of the pane now shown (so the first button of
 * the question is the safe answer).
 * Spec: docs/superpowers/specs/2026-10-12-blend-shared-ui-design.md §4.
 *
 *
 */
@Component({
  selector: 'k-confirm',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: block; }
    .stack { display: grid; }
    .pane {
      grid-area: 1 / 1;
      transition: opacity var(--confirm-dur, 200ms) ease;
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
      <div #pane class="pane" [class.off]="asking()">
        <ng-content select="[data-row]" />
      </div>
      <div #pane class="pane" [class.off]="!asking()">
        <ng-content select="[data-question]" />
      </div>
    </div>
  `,
})
export class KometaConfirm {
  readonly asking = input(false, { transform: booleanAttribute });

  private readonly panes = viewChildren<ElementRef<HTMLElement>>('pane');

  constructor() {
    const host = inject(ElementRef<HTMLElement>).nativeElement;
    const doc = inject(DOCUMENT);
    const injector = inject(Injector);
    let first = true;
    effect(() => {
      const asking = this.asking();
      if (first) { first = false; return; }
      // Read before the render hides the old pane: a browser drops focus from a `visibility: hidden` element.
      if (!host.contains(doc.activeElement)) return;
      afterNextRender(() => {
        this.panes()[asking ? 1 : 0]?.nativeElement.querySelector<HTMLElement>(FOCUSABLE)?.focus();
      }, { injector });
    });
  }
}
