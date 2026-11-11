import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, TemplateRef, ViewEncapsulation, contentChild, input } from '@angular/core';

/**
 * A plain `<table>` drawn with our classes, for the lists the consoles show: it keeps the
 * part of its API the pages used, so a page changes its tag and keeps its templates.
 *
 *     <kometa-table class="tbl" [value]="rows" dataKey="id">
 *       <ng-template #header><tr><th>…</th></tr></ng-template>
 *       <ng-template #body let-row><tr><td>{{ row.name }}</td></tr></ng-template>
 *       <ng-template #emptymessage><tr><td colspan="3">Nothing yet</td></tr></ng-template>
 *     </kometa-table>
 *
 * The templates write their own `<tr>`s. `dataKey` (a dotted path) keys the rows; `groupRowsBy` draws a `#groupheader`
 * row whenever that field changes; `tableStyleClass` and `tableStyle` land on the `<table>`; `scrollHeight` caps the
 * height, scrolls inside it and pins the header. Sorting and paging stay the pages' own (`kometaSortHeader`, `kometa-pager`).
 * Hairlines, the quiet header and the tabular figures are base rules at no specificity, so a page's own cell rules win.
 * Spec: kometa-table.spec.ts.
 */
@Component({
  selector: 'kometa-table',
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'ktable' },
  styles: `
    :where(kometa-table.ktable) { display: block; position: relative; font-variant-numeric: tabular-nums; }
    :where(.ktable-scroll) { overflow-x: auto; }
    :where(.ktable-scroll.is-capped) { overflow: auto; }
    :where(.ktable-table) { width: 100%; border-collapse: collapse; }
    :where(.ktable-table th) {
      padding: .75rem 1rem; text-align: left; font-weight: 600; color: var(--muted);
      border-bottom: 1px solid var(--glass-line, var(--border));
    }
    :where(.ktable-table td) { padding: .75rem 1rem; border-bottom: 1px solid var(--glass-line, var(--border)); }
    :where(.ktable-table tbody > tr) { transition: background-color .12s ease; }
    :where(.ktable-scroll.is-capped .ktable-table thead th) { position: sticky; top: 0; z-index: 1; background: var(--k-solid, var(--card)); }
  `,
  template: `
    <div class="ktable-scroll" [class.is-capped]="!!scrollHeight()" [style.max-height]="scrollHeight()">
      <table class="ktable-table" [class]="tableStyleClass()" [style]="tableStyle()">
        <thead>
          @if (header(); as tpl) { <ng-container [ngTemplateOutlet]="tpl" /> }
        </thead>
        <tbody>
          @for (row of value(); track keyOf($index, row)) {
            @if (groupRowsBy(); as by) {
              @if ($index === 0 || row[by] !== value()[$index - 1][by]) {
                <ng-container [ngTemplateOutlet]="groupheader() ?? null" [ngTemplateOutletContext]="{ $implicit: row }" />
              }
            }
            <ng-container [ngTemplateOutlet]="body() ?? null" [ngTemplateOutletContext]="{ $implicit: row, rowIndex: $index }" />
          } @empty {
            <ng-container [ngTemplateOutlet]="emptymessage() ?? null" />
          }
        </tbody>
      </table>
    </div>
  `,
})
export class KometaTable {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- rows are whatever the page loops over, as in the templates' `let-row`.
  readonly value = input<any[]>([]);
  readonly dataKey = input('');
  readonly groupRowsBy = input('');
  readonly tableStyleClass = input('');
  readonly tableStyle = input<Record<string, string> | null>(null);
  readonly scrollHeight = input<string | null>(null);

  protected readonly header = contentChild('header', { read: TemplateRef });
  protected readonly body = contentChild('body', { read: TemplateRef });
  protected readonly emptymessage = contentChild('emptymessage', { read: TemplateRef });
  protected readonly groupheader = contentChild('groupheader', { read: TemplateRef });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected keyOf(index: number, row: any): unknown {
    const path = this.dataKey();
    if (!path) return index;
    const key = path.split('.').reduce((o, k) => o?.[k], row);
    return key ?? index;
  }
}
