import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { docLang } from './paging';

/**
 * Two small sort controls in the Blend.
 *
 * `k-sort`: for a list of cards. Options are words (like `k-words`); the active one is
 * `--text` with a 2px cream line, followed by ↑ or ↓. Tapping the active word asks for the other
 * direction; tapping another asks for that key. It holds no state, it only says what was tapped:
 *
 *   <k-sort [options]="sortOptions" [key]="view.sort()" [dir]="view.dir()" (pick)="view.pickSort($event)" />
 *
 * `th[kometaSortHeader]`: for a table column the user can sort. It puts a button inside the `<th>`
 * (so the name stays the column's text), sets `aria-sort` on the th, and draws the glyph while this
 * column is the active one:
 *
 *   <th kometaSortHeader="name" [active]="view.sort()" [dir]="view.dir()" (pick)="view.pickSort($event)">Name</th>
 *
 * Both: 44px targets on a coarse pointer, cream line (never amber), focus ring amber, nothing animated,
 * the direction spoken to a screen reader in the page language (uz/ru/en).
 */
export interface KometaSortOption {
  value: string;
  label: string;
}

const SPOKEN = {
  uz: { sort: 'Saralash', asc: 'o‘sish bo‘yicha', desc: 'kamayish bo‘yicha' },
  ru: { sort: 'Сортировка', asc: 'по возрастанию', desc: 'по убыванию' },
  en: { sort: 'Sort', asc: 'ascending', desc: 'descending' },
} as const;

@Component({
  selector: 'k-sort',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'group', '[attr.aria-label]': 'ariaLabel() || spoken().sort' },
  styles: `
    :host { display: inline-flex; flex-wrap: wrap; gap: 0 var(--sort-gap, 16px); align-items: center; }
    button {
      margin: 0;
      padding: 8px 0 8px;
      border: 0;
      border-bottom: 2px solid transparent;
      border-radius: 0;
      background: transparent;
      color: var(--muted);
      font: inherit;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    button:hover { color: var(--text); }
    button[aria-pressed='true'] { color: var(--text); border-bottom-color: var(--display-ink, #f4efe6); }
    button:focus-visible { outline: 2px solid var(--amber); outline-offset: 2px; }
    .glyph { font-size: var(--t-sm, 12px); line-height: 1; }
    .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
    @media (pointer: coarse) { button { min-height: 44px; } }
  `,
  template: `
    @for (o of options(); track o.value) {
      <button type="button" [attr.aria-pressed]="o.value === key() ? 'true' : 'false'" (click)="pick.emit(o.value)">
        {{ o.label }}
        @if (o.value === key()) {
          <span class="glyph" aria-hidden="true">{{ dir() === 'desc' ? descGlyph() : ascGlyph() }}</span>
          <span class="sr">{{ dir() === 'desc' ? spoken().desc : spoken().asc }}</span>
        }
      </button>
    }
  `,
})
export class KometaSort {
  readonly options = input.required<readonly KometaSortOption[]>();
  readonly key = input('');
  readonly dir = input<'asc' | 'desc'>('asc');
  readonly ariaLabel = input('');
  /** The glyphs after the active word. */
  readonly ascGlyph = input('↑');
  readonly descGlyph = input('↓');
  readonly pick = output<string>();
  protected readonly spoken = computed(() => SPOKEN[docLang()]);
}

@Component({
  selector: 'th[kometaSortHeader]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.aria-sort]': 'sort()' },
  styles: `
    button {
      margin: 0;
      padding: 0;
      border: 0;
      background: transparent;
      color: inherit;
      font: inherit;
      letter-spacing: inherit;
      text-transform: inherit;
      text-align: inherit;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    button:hover { color: var(--text); }
    button:focus-visible { outline: 2px solid var(--amber); outline-offset: 2px; }
    .glyph { font-size: var(--t-sm, 12px); line-height: 1; color: var(--text); }
    @media (pointer: coarse) { button { min-height: 44px; } }
  `,
  template: `
    <button type="button" (click)="pick.emit(kometaSortHeader())"><ng-content />@if (on()) {<span class="glyph" aria-hidden="true">{{ dir() === 'desc' ? descGlyph() : ascGlyph() }}</span>}</button>
  `,
})
export class KometaSortHeader {
  /** This column's key. */
  readonly kometaSortHeader = input.required<string>();
  /** The key the list is sorted by now. */
  readonly active = input('');
  readonly dir = input<'asc' | 'desc'>('asc');
  readonly ascGlyph = input('↑');
  readonly descGlyph = input('↓');
  readonly pick = output<string>();
  protected readonly on = computed(() => this.active() === this.kometaSortHeader());
  protected readonly sort = computed(() => (this.on() ? (this.dir() === 'desc' ? 'descending' : 'ascending') : 'none'));
}
