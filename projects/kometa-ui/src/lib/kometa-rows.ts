import { ChangeDetectionStrategy, Component, ViewEncapsulation, booleanAttribute, computed, input, output } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';

export type KometaRowTone = 'neutral' | 'amber' | 'blue' | 'green' | 'violet' | 'red' | 'telegram' | 'danger';

let nextPanel = 0;

/**
 * The Blend glass panel that holds rows: a small muted caps `label` above it, a 1px hairline
 * between the rows, inset 16px from the left. Rows are `k-row`.
 *
 * Semantics: a panel is `role="list"` and a row `role="listitem"`. A native `<dl>` cannot hold a
 * custom element between itself and its `dt`/`dd`, so a fact row marks its label `term` and its
 * value `definition` instead. Spec: docs/superpowers/specs/2026-10-12-blend-shared-ui-design.md §4.
 */
@Component({
  selector: 'k-rows',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styles: `
    k-rows { display: block; }
    k-rows .cap {
      margin: 0 0 var(--sp-4, 8px) var(--sp-2, 4px);
      font-size: var(--t-tiny, 11px);
      font-weight: var(--w-bold, 700);
      letter-spacing: var(--track-label, .08em);
      text-transform: uppercase;
      color: var(--muted);
    }
    k-rows .panel {
      overflow: hidden;
      background: var(--glass, var(--card));
      border: 1px solid var(--glass-line, var(--border));
      border-radius: var(--rows-radius, 20px);
      box-shadow: inset 0 1px 0 var(--glass-hi, rgba(255, 255, 255, .1));
      -webkit-backdrop-filter: blur(8px) saturate(1.2);
      backdrop-filter: blur(8px) saturate(1.2);
    }
    @media (prefers-reduced-transparency: reduce) {
      k-rows .panel { -webkit-backdrop-filter: none; backdrop-filter: none; }
    }
  `,
  template: `
    @if (label()) { <p class="cap" [id]="capId">{{ label() }}</p> }
    <div class="panel" role="list" [attr.aria-labelledby]="label() ? capId : null" [attr.aria-label]="label() ? null : (ariaLabel() || null)">
      <ng-content />
    </div>
  `,
})
export class KometaRows {
  /** The tiny heading above the panel ("ACCOUNT"). */
  readonly label = input('');
  /** The panel's name when it has no visible heading. */
  readonly ariaLabel = input('');
  protected readonly capId = `k-rows-${nextPanel++}`;
}

/**
 * One row of a `k-rows` panel, in one of two modes.
 *
 * Fact: `label` plus the projected value, right-aligned and wrapping from the right edge.
 * Setting: `title`, optional `meta` line, an optional leading tile (project `<… rowIcon>`; `tone`
 * tints it), and the projected trailing content. A `link` (router commands), an `href` or `button`
 * (with `(activated)`) makes the whole row one control, 56px tall, with a hover and pressed wash, a
 * focus ring and a chevron (`[chevron]="false"` leaves it off). Without one the row is static and
 * may hold its own controls (words, a switch). `tone="danger"` also reddens the title.
 */
@Component({
  selector: 'k-row',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [NgTemplateOutlet, RouterLink],
  host: {
    role: 'listitem',
    '[attr.data-tone]': 'tone()',
    '[class.act]': 'act()',
    '[class.danger]': "tone() === 'danger'",
  },
  styles: `
    k-row { display: block; position: relative; }
    k-row:not(:first-child)::before {
      content: '';
      position: absolute;
      top: 0; right: 0; left: 16px;
      height: 1px;
      background: var(--glass-line, var(--border));
      pointer-events: none;
    }
    k-row .r {
      box-sizing: border-box;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 4px 12px;
      width: 100%;
      min-height: var(--row-min-height, 56px);
      margin: 0;
      padding: 10px var(--row-pad-x, 16px);
      border: 0;
      background: none;
      color: var(--text);
      font: inherit;
      font-size: var(--t-body, 15px);
      text-align: start;
      text-decoration: none;
    }
    k-row .r.fact { min-height: 48px; align-items: baseline; flex-wrap: nowrap; gap: 16px; }
    k-row.act .r { cursor: pointer; flex-wrap: nowrap; transition: background-color .12s ease; }
    k-row.act .r:hover { background: var(--row-wash, rgba(128, 128, 128, .1)); }
    k-row.act .r:active { background: var(--row-wash-press, rgba(128, 128, 128, .18)); }
    k-row .r:focus-visible { outline: 2px solid var(--amber); outline-offset: -2px; }
    k-row .r:disabled { cursor: default; opacity: .6; }
    k-row .r:disabled:hover { background: none; }
    k-row .ico {
      display: inline-flex;
      flex: none;
      align-items: center;
      justify-content: center;
      width: var(--row-icon-size, 36px); height: var(--row-icon-size, 36px);
      border-radius: var(--row-icon-radius, 12px);
      background: var(--input);
      color: var(--text2);
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    k-row .ico:empty { display: none; }
    k-row .ico > * { width: 18px; height: 18px; margin: 0; }
    k-row[data-tone='amber'] .ico { background: rgba(255, 191, 0, .14); color: var(--amber-ink); }
    k-row[data-tone='blue'] .ico { background: var(--blue-bg); color: var(--blue); }
    k-row[data-tone='green'] .ico { background: var(--green-bg); color: var(--green); }
    k-row[data-tone='violet'] .ico { background: var(--violet-bg); color: var(--violet); }
    k-row[data-tone='telegram'] .ico { background: rgba(42, 171, 238, .15); /* on brand */ }
    k-row[data-tone='red'] .ico,
    k-row.danger .ico { background: var(--red-bg); color: var(--red); }
    k-row .txt { display: flex; flex: 1 1 0; flex-direction: column; gap: 2px; min-width: 6rem; }
    k-row .t { font-weight: var(--w-bold, 700); overflow-wrap: anywhere; }
    k-row.danger .t { color: var(--red); }
    k-row .m { font-size: var(--t-sm, 13px); color: var(--muted); }
    k-row .end {
      display: flex;
      flex: none;
      align-items: center;
      gap: 8px;
      max-width: 100%;
      margin-inline-start: auto;
      font-size: var(--t-sm, 13px);
      font-weight: var(--w-semi, 600);
      color: var(--muted);
    }
    k-row .end:empty { display: none; }
    k-row .chev {
      flex: none;
      width: 16px; height: 16px;
      fill: none;
      stroke: var(--muted);
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    /* A fact: the label is a muted caption, the value takes the rest and wraps from the right edge. */
    /* The label breaks only between words: \`overflow-wrap: anywhere\` shrinks the column's min-content to
       one letter, and the label then wrapped "Service" into "Se / rvi / ce". */
    k-row .fact .t { overflow-wrap: normal; font-size: var(--t-sm, 13px); font-weight: var(--w-semi, 600); color: var(--muted); }
    /* No dotted leader between label and value: the panel already draws a rule under every row, and the
       two together read as a conflict (2026-10-19). */
    k-row .fact .txt { flex: 1 1 auto; flex-direction: row; align-items: baseline; gap: 8px; min-width: 0; }
    k-row .fact .end {
      display: block;
      flex: 0 1 auto;
      max-width: 60%;
      min-width: 0;
      font-size: var(--t-body, 15px);
      font-weight: var(--w-semi, 600);
      font-variant-numeric: tabular-nums;
      text-align: end;
      overflow-wrap: anywhere;
      color: var(--text);
    }
    @media (prefers-reduced-motion: reduce) {
      k-row.act .r { transition: none; }
    }
  `,
  template: `
    @if (link() !== null) {
      <a class="r" [routerLink]="$any(link())" [attr.aria-label]="ariaLabel() || null"><ng-container [ngTemplateOutlet]="body" /></a>
    } @else if (href()) {
      <a class="r" [href]="href()" [attr.target]="target() || null" [attr.rel]="target() === '_blank' ? 'noopener' : null" [attr.aria-label]="ariaLabel() || null"><ng-container [ngTemplateOutlet]="body" /></a>
    } @else if (button()) {
      <button class="r" type="button" [attr.aria-label]="ariaLabel() || null" [disabled]="disabled()" (click)="activated.emit()"><ng-container [ngTemplateOutlet]="body" /></button>
    } @else {
      <div class="r" [class.fact]="!!label()"><ng-container [ngTemplateOutlet]="body" /></div>
    }
    <ng-template #body>
      <span class="ico" aria-hidden="true"><ng-content select="[rowIcon]" /></span>
      <span class="txt">
        <span class="t" [attr.role]="label() ? 'term' : null">{{ label() || title() }}</span>
        @if (meta()) { <span class="m">{{ meta() }}</span> }
      </span>
      <span class="end" [attr.role]="label() ? 'definition' : null"><ng-content /></span>
      @if (act() && chevron()) {
        <svg class="chev" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3l5 5-5 5" /></svg>
      }
    </ng-template>
  `,
})
export class KometaRow {
  /** Fact mode: the caption on the left; the projected content is its value. */
  readonly label = input('');
  /** Setting mode: the bold title. */
  readonly title = input('');
  readonly meta = input('');
  /** Overrides the accessible name of a row that is a link or a button. */
  readonly ariaLabel = input('');
  /** Where an `href` row opens (`_blank` adds `rel=noopener`). */
  readonly target = input('');
  /** Tints the leading tile; `red` is a red tile, `danger` a red tile and a red title. */
  readonly tone = input<KometaRowTone>('neutral');
  /** Router commands (or a path): the whole row becomes a `routerLink` anchor. */
  readonly link = input<string | readonly unknown[] | null>(null);
  /** A plain URL: the whole row becomes an anchor (a static page, `mailto:`). */
  readonly href = input('');
  /** The whole row becomes a button that emits `activated`. */
  readonly button = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly chevron = input(true, { transform: booleanAttribute });
  readonly activated = output<void>();

  protected readonly act = computed(() => this.link() !== null || !!this.href() || this.button());
}
