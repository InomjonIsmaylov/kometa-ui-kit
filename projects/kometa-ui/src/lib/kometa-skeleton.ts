import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input } from '@angular/core';

/**
 * Loading placeholder with no blocks: a hairline disc and hairlines that draw themselves, row by row.
 * `shape="line"` is one hairline with a bright stretch sliding along it, for a table cell: it takes the cell's
 * width (or `width`), keeps no height of its own and says nothing to a screen reader (the table's wrapper does).
 * Spec: docs/superpowers/specs/2026-10-12-blend-shared-ui-design.md, "Skeleton: hair".
 */
@Component({
  selector: 'kometa-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.role]': "shape() === 'line' ? null : 'status'",
    '[attr.aria-busy]': "shape() === 'line' ? null : 'true'",
    '[attr.aria-hidden]': "shape() === 'line' ? 'true' : null",
    '[attr.aria-label]': "shape() === 'line' ? null : ariaLabel() || null",
    '[attr.data-shape]': 'shape()',
  },
  styles: `
    :host { display: flex; flex-direction: column; gap: 18px; }
    .r { display: flex; align-items: center; gap: 12px; }
    .disc {
      flex: none;
      width: var(--hair-disc, 40px);
      height: var(--hair-disc, 40px);
      box-sizing: border-box;
      border-radius: 50%;
      border: 1px solid var(--hair-ink, var(--display-ink, #f4efe6));
      opacity: .25;
    }
    .lines { flex: 1; display: flex; flex-direction: column; gap: 8px; min-width: 0; }
    .l {
      display: block;
      height: 1px;
      margin: 4px 0;
      background: var(--hair-ink, var(--display-ink, #f4efe6));
      opacity: .55;
      transform-origin: left;
      animation: k-skh 1.8s var(--ease-out, cubic-bezier(0.22, 1, 0.36, 1)) infinite;
      animation-delay: var(--d, 0s);
    }
    .l:nth-child(1) { width: 84%; }
    .l:nth-child(2) { width: 62%; }
    .l:nth-child(3) { width: 40%; }
    .card {
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      gap: 8px;
      min-height: 160px;
      padding: 16px;
      box-sizing: border-box;
      border: 1px solid var(--glass-line, rgba(244, 239, 230, .14));
      border-radius: var(--r-card, 20px);
    }
    :host([data-shape='line']) { display: block; gap: 0; }
    .glint {
      position: relative;
      display: block;
      height: 1px;
      margin: 5px 0;
      overflow: hidden;
      background: var(--glass-line, rgba(244, 239, 230, .14));
    }
    .glint::after {
      content: '';
      position: absolute;
      inset: 0;
      width: 28%;
      background: var(--hair-ink, var(--display-ink, #f4efe6));
      opacity: .7;
      animation: k-skg 1.5s var(--ease-spring, cubic-bezier(0.22, 1.15, 0.36, 1)) infinite;
      animation-delay: var(--d, 0s);
    }
    @keyframes k-skg { from { transform: translateX(-100%); } to { transform: translateX(380%); } }
    @keyframes k-skh { 0% { transform: scaleX(0); } 60%, 100% { transform: scaleX(1); } }
    @media (prefers-reduced-motion: reduce) {
      .l { animation: none; }
      .glint::after { animation: none; width: 100%; opacity: .25; }
    }
  `,
  template: `
    @if (shape() === 'line') {
      <i class="glint" [style.width]="width()" [style.--d]="delay() + 'ms'"></i>
    } @else if (shape() === 'card') {
      <div class="card">
        @for (i of three; track i) { <i class="l" [style.--d]="i * 0.2 + 's'"></i> }
      </div>
    } @else {
      @for (i of list(); track i) {
        <div class="r">
          @if (avatar()) { <i class="disc"></i> }
          <div class="lines">
            @for (j of lineList(); track j) { <i class="l" [style.--d]="i * 0.2 + 's'"></i> }
          </div>
        </div>
      }
    }
  `,
})
export class KometaSkeleton {
  /** List rows to draw (shape `rows` only; a card is always one frame). */
  readonly rows = input(3);
  /** The leading disc of a row (shape `rows`). */
  readonly avatar = input(true, { transform: booleanAttribute });
  /** Hairlines per row (shape `rows`). */
  readonly lines = input(2);
  readonly shape = input<'rows' | 'card' | 'line'>('rows');
  /** The hairline's width (shape `line` only), as a CSS length: a share of the cell, say `72%`. */
  readonly width = input('100%');
  /** Milliseconds to wait before the glint starts, so a column of cells does not move as one. */
  readonly delay = input(0);
  /** The caller's word for "loading" ("Yuklanmoqda"); the component holds no text. */
  readonly ariaLabel = input('');

  protected readonly lineList = computed(() => Array.from({ length: Math.max(1, Math.floor(this.lines())) }, (_, i) => i));
  protected readonly three = [0, 1, 2];
  protected readonly list = computed(() => Array.from({ length: Math.max(0, Math.floor(this.rows())) }, (_, i) => i));
}
